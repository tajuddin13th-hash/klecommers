import {
  AdvancedMarker,
  APIProvider,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { CheckCircle2, Clock, MapPin, Navigation, Package, Truck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Order, OrderStatus } from '../types';

const HUB_ADDRESS = 'KLE Technological University, Vidyanagar, Hubballi, Karnataka 580031, India';

interface LatLngLiteral {
  lat: number;
  lng: number;
}

interface MapsLatLng {
  lat: () => number;
  lng: () => number;
}

interface MapsPolyline {
  setMap: (map: unknown) => void;
  setOptions: (options: { strokeColor?: string; strokeOpacity?: number; strokeWeight?: number }) => void;
  getPath: () => { getLength: () => number; getAt: (i: number) => MapsLatLng };
}

interface MapsLatLngBounds {
  extend?: (point: LatLngLiteral) => void;
}

interface RouteSummary {
  distanceMeters: number;
  durationMillis: number;
  originPos: LatLngLiteral;
  destinationPos: LatLngLiteral;
  courierPos: LatLngLiteral;
}

function getProgressRatio(status: OrderStatus): number {
  switch (status) {
    case 'Confirmed':
      return 0.05;
    case 'Packed':
      return 0.25;
    case 'Shipped':
      return 0.62;
    case 'Delivered':
      return 1;
    case 'Cancelled':
      return 0;
  }
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  if (totalMinutes < 60) return `${totalMinutes} mins`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}

function isQuotaError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toUpperCase();
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('QUOTA')
  );
}

interface ShippingRouteLayerProps {
  originQuery: string;
  destinationQuery: string;
  originCoords: LatLngLiteral | null;
  destinationCoords: LatLngLiteral | null;
  order: Order;
  onSummaryChange: (summary: RouteSummary | null) => void;
  onRouteError: (message: string | null) => void;
}

function ShippingRouteLayer({
  originQuery,
  destinationQuery,
  originCoords,
  destinationCoords,
  order,
  onSummaryChange,
  onRouteError,
}: ShippingRouteLayerProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<MapsPolyline[]>([]);
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [activeInfo, setActiveInfo] = useState<'origin' | 'courier' | 'destination' | null>(null);

  const [originMarkerRef, originMarker] = useAdvancedMarkerRef();
  const [courierMarkerRef, courierMarker] = useAdvancedMarkerRef();
  const [destMarkerRef, destMarker] = useAdvancedMarkerRef();

  const progressRatio = useMemo(() => getProgressRatio(order.status), [order.status]);

  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteError(null);

    let cancelled = false;

    const originInput = originCoords || originQuery;
    const destInput = destinationCoords || destinationQuery;

    const request = {
      origin: originInput,
      destination: destInput,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    const RouteClass = routesLib.Route as unknown as {
      computeRoutes: (req: typeof request) => Promise<{
        routes?: Array<{
          path?: MapsLatLng[];
          distanceMeters?: number;
          durationMillis?: number;
          viewport?: MapsLatLngBounds;
          createPolylines: () => MapsPolyline[];
        }>;
      }>;
    };

    RouteClass.computeRoutes(request)
      .then(({ routes }) => {
        if (cancelled) return;
        if (!routes || routes.length === 0) {
          onRouteError('No driving route found between the dispatch hub and destination.');
          return;
        }

        const primaryRoute = routes[0];
        const createdPolylines = primaryRoute.createPolylines();
        const pathPoints: LatLngLiteral[] = [];

        createdPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#6D28D9',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });
          polyline.setMap(map);
          const pts = polyline.getPath();
          for (let i = 0; i < pts.getLength(); i += 1) {
            const pt = pts.getAt(i);
            pathPoints.push({ lat: pt.lat(), lng: pt.lng() });
          }
        });
        polylinesRef.current = createdPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 48);
        }

        const resolvedOrigin =
          originCoords || pathPoints[0] || null;
        const resolvedDest =
          destinationCoords || pathPoints[pathPoints.length - 1] || null;

        if (resolvedOrigin && resolvedDest) {
          let courierPos = resolvedOrigin;
          if (pathPoints.length > 1) {
            const idx = Math.min(
              pathPoints.length - 1,
              Math.max(0, Math.round((pathPoints.length - 1) * progressRatio))
            );
            courierPos = pathPoints[idx];
          } else {
            courierPos = {
              lat: resolvedOrigin.lat + (resolvedDest.lat - resolvedOrigin.lat) * progressRatio,
              lng: resolvedOrigin.lng + (resolvedDest.lng - resolvedOrigin.lng) * progressRatio,
            };
          }

          const nextSummary: RouteSummary = {
            distanceMeters: primaryRoute.distanceMeters ?? 0,
            durationMillis: primaryRoute.durationMillis ?? 0,
            originPos: resolvedOrigin,
            destinationPos: resolvedDest,
            courierPos,
          };
          setSummary(nextSummary);
          onSummaryChange(nextSummary);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteError(
          err instanceof Error
            ? err.message
            : 'Unable to compute shipping route at the moment.'
        );
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [
    routesLib,
    map,
    originQuery,
    destinationQuery,
    originCoords,
    destinationCoords,
    progressRatio,
    onSummaryChange,
    onRouteError,
  ]);

  const displayedOrigin = summary?.originPos || originCoords;
  const displayedDest = summary?.destinationPos || destinationCoords;
  const displayedCourier = summary?.courierPos;

  return (
    <>
      {displayedOrigin && (
        <>
          <AdvancedMarker
            ref={originMarkerRef}
            position={displayedOrigin}
            title="Dispatch Hub: Hubballi"
            onClick={() => setActiveInfo('origin')}
          >
            <Pin background="#0B192C" borderColor="#060D1A" glyphColor="#FFFFFF" />
          </AdvancedMarker>
          {activeInfo === 'origin' && originMarker && (
            <InfoWindow anchor={originMarker} onCloseClick={() => setActiveInfo(null)}>
              <div className="p-1 text-xs">
                <p className="font-bold text-[#0B192C]">Fulfillment Dispatch Hub</p>
                <p className="text-slate-600 mt-0.5">Vidyanagar, Hubballi 580031</p>
              </div>
            </InfoWindow>
          )}
        </>
      )}

      {displayedCourier &&
        (order.status === 'Packed' || order.status === 'Shipped') && (
          <>
            <AdvancedMarker
              ref={courierMarkerRef}
              position={displayedCourier}
              title={`Shipment in Transit (${order.status})`}
              onClick={() => setActiveInfo('courier')}
            >
              <Pin background="#6D28D9" borderColor="#4C1D95" glyphColor="#FFFFFF" scale={1.15} />
            </AdvancedMarker>
            {activeInfo === 'courier' && courierMarker && (
              <InfoWindow anchor={courierMarker} onCloseClick={() => setActiveInfo(null)}>
                <div className="p-1 text-xs">
                  <p className="font-bold text-purple-700">Live Carrier Checkpoint</p>
                  <p className="text-slate-600 mt-0.5">
                    Order {order.orderNumber} · {order.status}
                  </p>
                </div>
              </InfoWindow>
            )}
          </>
        )}

      {displayedDest && (
        <>
          <AdvancedMarker
            ref={destMarkerRef}
            position={displayedDest}
            title={`Delivery Address: ${order.city}`}
            onClick={() => setActiveInfo('destination')}
          >
            <Pin background="#059669" borderColor="#065F46" glyphColor="#FFFFFF" />
          </AdvancedMarker>
          {activeInfo === 'destination' && destMarker && (
            <InfoWindow anchor={destMarker} onCloseClick={() => setActiveInfo(null)}>
              <div className="p-1 text-xs max-w-[200px]">
                <p className="font-bold text-emerald-700">Delivery Destination</p>
                <p className="text-slate-700 mt-0.5">{order.customerName}</p>
                <p className="text-slate-500">
                  {order.address}, {order.city} — {order.pinCode}
                </p>
              </div>
            </InfoWindow>
          )}
        </>
      )}
    </>
  );
}

function MapLoadingMonitor() {
  const status = useApiLoadingStatus();
  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <div className="p-4 text-xs text-red-700 bg-red-50 border-t border-red-200">
        Unable to load Google Maps. Please verify your API key and network connection.
      </div>
    );
  }
  return null;
}

export function OrderShippingMap({ order }: { order: Order }) {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const [apiKey, setApiKey] = useState(envKey);
  const [keyLoading, setKeyLoading] = useState(!envKey);

  const [originCoords, setOriginCoords] = useState<LatLngLiteral | null>(null);
  const [destCoords, setDestCoords] = useState<LatLngLiteral | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const destinationQuery = `${order.address}, ${order.city}, ${order.pinCode}, India`;
  const fallbackDestinationQuery = `${order.city}, ${order.pinCode}, India`;

  useEffect(() => {
    if (envKey) return;
    let active = true;
    fetch('/api/config/maps')
      .then((res) => res.json())
      .then((data: { apiKey?: string }) => {
        if (active && data.apiKey) setApiKey(data.apiKey);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setKeyLoading(false);
      });
    return () => {
      active = false;
    };
  }, [envKey]);

  const geocodeViaProxy = useCallback(async (address: string): Promise<LatLngLiteral | null> => {
    try {
      const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(address)}`);
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        return null;
      }
      const data = (await res.json()) as {
        location?: LatLngLiteral;
        status?: string;
      };
      if (data.status === 'RESOURCE_EXHAUSTED') {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        return null;
      }
      return data.location || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    let active = true;

    Promise.all([
      geocodeViaProxy(HUB_ADDRESS),
      geocodeViaProxy(destinationQuery).then((loc) =>
        loc ? loc : geocodeViaProxy(fallbackDestinationQuery)
      ),
    ]).then(([orig, dest]) => {
      if (!active) return;
      if (orig) setOriginCoords(orig);
      if (dest) setDestCoords(dest);
    });

    return () => {
      active = false;
    };
  }, [apiKey, destinationQuery, fallbackDestinationQuery, geocodeViaProxy]);

  const steps: Array<{ key: OrderStatus; label: string }> = [
    { key: 'Confirmed', label: 'Order Confirmed' },
    { key: 'Packed', label: 'Packed at Hub' },
    { key: 'Shipped', label: 'Out for Transit' },
    { key: 'Delivered', label: 'Delivered' },
  ];

  const activeStepIndex =
    order.status === 'Cancelled'
      ? -1
      : steps.findIndex((s) => s.key === order.status);

  return (
    <section
      id="shipping-map"
      className="mt-8 rounded-3xl border border-slate-200 bg-white overflow-hidden"
    >
      <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700">
            <Truck className="w-4 h-4" />
            Live Order Shipping Map
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-[#0B192C]">
            Shipment Route · {order.city} ({order.pinCode})
          </h2>
        </div>

        {routeSummary && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="inline-flex items-center gap-1.5 text-slate-700 font-semibold tabular-nums">
              <Navigation className="w-4 h-4 text-purple-700" />
              <span>{(routeSummary.distanceMeters / 1000).toFixed(1)} km route</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-slate-700 font-semibold tabular-nums">
              <Clock className="w-4 h-4 text-purple-700" />
              <span>Est. {formatDuration(routeSummary.durationMillis)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Shipment Status Stepper */}
      <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-b border-slate-100">
        {order.status === 'Cancelled' ? (
          <p className="text-xs font-semibold text-red-600">
            This shipment was cancelled before dispatch.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((step, idx) => {
              const completed = idx <= activeStepIndex;
              return (
                <div key={step.key} className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      completed
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      completed ? 'text-[#0B192C]' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Map Viewport */}
      {keyLoading ? (
        <div className="h-[380px] bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-500">
          Loading shipping map...
        </div>
      ) : !apiKey ? (
        <div className="p-8 bg-slate-50 text-center space-y-2">
          <MapPin className="w-7 h-7 mx-auto text-slate-400" />
          <p className="font-display text-sm font-bold text-[#0B192C]">
            Google Maps API key required for live route map
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Configure <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in your environment to render the interactive shipping route from Hubballi to {order.city}.
          </p>
        </div>
      ) : (
        <APIProvider apiKey={apiKey} libraries={['routes', 'marker']}>
          <div className="relative w-full h-[380px]">
            <GoogleMap
              mapId="DEMO_MAP_ID"
              defaultCenter={originCoords || { lat: 15.3647, lng: 75.124 }}
              defaultZoom={7}
              gestureHandling="greedy"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '380px' }}
            >
              <ShippingRouteLayer
                originQuery={HUB_ADDRESS}
                destinationQuery={destinationQuery}
                originCoords={originCoords}
                destinationCoords={destCoords}
                order={order}
                onSummaryChange={setRouteSummary}
                onRouteError={setRouteError}
              />
            </GoogleMap>
          </div>
          <MapLoadingMonitor />
        </APIProvider>
      )}

      {routeError && (
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-200 text-xs text-amber-800">
          {routeError}
        </div>
      )}

      {/* Legend */}
      <div className="px-6 sm:px-8 py-3.5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#0B192C]" />
            Dispatch Hub (Hubballi)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-purple-700" />
            Transit Carrier ({order.status})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            Destination ({order.city})
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Click any map pin for stop details
        </span>
      </div>
    </section>
  );
}
