import L from "leaflet";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { UserLocation } from "@/types/quest";

// 引入 leaflet-routing-machine 的 CSS
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

interface RoutingMachineProps {
  start: UserLocation;
  end: { lat: number; lng: number };
}

const RoutingMachine = ({ start, end }: RoutingMachineProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      const routingControl = (L.Routing as any).control({
        waypoints: [
          L.latLng(start.lat, start.lng),
          L.latLng(end.lat, end.lng)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        show: false,
        createMarker: function() { return null; }, // 隱藏預設標記
        lineOptions: {
          styles: [{ color: '#6366f1', opacity: 0.8, weight: 6 }]
        }
      }).addTo(map);

      return () => {
        try {
          map.removeControl(routingControl);
        } catch (e) {
          console.error('Error removing routing control:', e);
        }
      };
    } catch (error) {
      console.error('Error creating routing control:', error);
      return undefined;
    }
  }, [map, start.lat, start.lng, end.lat, end.lng]);

  return null;
};

export default RoutingMachine;
