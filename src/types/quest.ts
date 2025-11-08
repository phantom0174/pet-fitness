export interface QuestLocation {
  id: string;
  name: string;
  description: string;
  category: "景點" | "公園" | "運動場館";
  lat: number;
  lng: number;
  bonus: {
    strength?: number;
    mood?: number;
  };
  status: "available" | "in-progress" | "completed";
  distance?: number; // 距離使用者的距離（公尺）
  requiredDistance?: number; // 需要多近才能接任務（公尺）
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}
