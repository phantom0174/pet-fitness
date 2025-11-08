import { Home, BarChart3, ListTodo } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { title: "首頁", url: "/", icon: Home },
  { title: "Status", url: "/status", icon: BarChart3 },
];

const dailyMissions = [
  { id: 1, task: "運動10分鐘", reward: "+10體力", completed: false },
  { id: 2, task: "走路5000步", reward: "+5心情", completed: false },
  { id: 3, task: "拜訪一個景點", reward: "+15成長", completed: false },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const [missions, setMissions] = useState(dailyMissions);
  const [missionsOpen, setMissionsOpen] = useState(false);

  const toggleMission = (id: number) => {
    setMissions(missions.map(m => 
      m.id === id ? { ...m, completed: !m.completed } : m
    ));
  };

  return (
    <Sidebar className="border-r" style={{ borderColor: 'var(--tp-grayscale-200)' }}>
      <SidebarContent style={{ backgroundColor: 'var(--tp-white)' }}>
        <SidebarGroup>
          <SidebarGroupLabel className="tp-h3-semibold" style={{ color: 'var(--tp-grayscale-700)' }}>
            選單
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="tp-body-regular hover:bg-opacity-50"
                      style={{ color: 'var(--tp-grayscale-700)' }}
                      activeClassName="font-semibold"
                      activeStyle={{ 
                        backgroundColor: 'var(--tp-primary-100)',
                        color: 'var(--tp-primary-700)'
                      }}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={missionsOpen} onOpenChange={setMissionsOpen}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="tp-h3-semibold flex items-center justify-between w-full hover:bg-opacity-50" style={{ color: 'var(--tp-grayscale-700)' }}>
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  {open && <span>每日任務</span>}
                </div>
                {open && <ChevronDown className={`w-4 h-4 transition-transform ${missionsOpen ? 'rotate-180' : ''}`} />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="space-y-2 px-2">
                  {missions.map((mission) => (
                    <div 
                      key={mission.id}
                      className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-opacity-50"
                      style={{ backgroundColor: mission.completed ? 'var(--tp-primary-50)' : 'transparent' }}
                      onClick={() => toggleMission(mission.id)}
                    >
                      <div 
                        className="w-4 h-4 rounded border-2 flex items-center justify-center"
                        style={{ 
                          borderColor: mission.completed ? 'var(--tp-primary-500)' : 'var(--tp-grayscale-300)',
                          backgroundColor: mission.completed ? 'var(--tp-primary-500)' : 'transparent'
                        }}
                      >
                        {mission.completed && <span style={{ color: 'var(--tp-white)' }}>✓</span>}
                      </div>
                      {open && (
                        <div className="flex-1">
                          <div className="tp-body-regular" style={{ 
                            color: mission.completed ? 'var(--tp-grayscale-500)' : 'var(--tp-grayscale-700)',
                            textDecoration: mission.completed ? 'line-through' : 'none'
                          }}>
                            {mission.task}
                          </div>
                          <div className="tp-caption" style={{ color: 'var(--tp-secondary-600)' }}>
                            {mission.reward}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
