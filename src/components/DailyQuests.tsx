import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { getUserDailyQuests, claimDailyQuest } from "@/lib/api";
import { toast } from "sonner";

interface DailyQuestsProps {
    userId: string;
    onQuestCompleted?: () => void;
}

// Hard-coded 每日任務
const DAILY_QUESTS = [
    {
        id: 1,
        title: "每日登錄",
        description: "登錄遊戲即可完成",
        reward_strength: 5,
        reward_stamina: 5,
        reward_mood: 5,
    },
    {
        id: 2,
        title: "運動達人",
        description: "累計運動 10 分鐘",
        reward_strength: 10,
        reward_stamina: 0,
        reward_mood: 5,
    },
    {
        id: 3,
        title: "步行挑戰",
        description: "累計步行 5000 步",
        reward_strength: 10,
        reward_stamina: 0,
        reward_mood: 5,
    },
];

const DailyQuests = ({ userId, onQuestCompleted }: DailyQuestsProps) => {
    const [claimedQuests, setClaimedQuests] = useState<Set<number>>(new Set());
    const [claimableQuests, setClaimableQuests] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [claiming, setClaiming] = useState<number | null>(null);

    const loadQuests = async () => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const data = await getUserDailyQuests(userId);

            // Reset sets
            const claimed = new Set<number>();
            const claimable = new Set<number>();

            // Support explicit fields if backend returns clear names
            // e.g., quest_1_claimed, quest_1_claimable
            for (const q of DAILY_QUESTS) {
                const id = q.id;
                const claimedKey = `quest_${id}_claimed`;
                const completedKey = `quest_${id}_completed`;
                const claimableKey = `quest_${id}_claimable`;

                // Determine claimed/claimed-like value
                let isClaimed = false;
                if (data && typeof data[claimedKey] !== "undefined") {
                    isClaimed = !!data[claimedKey];
                } else if (data && typeof data[completedKey] !== "undefined") {
                    // Backwards compat: assume completed == claimed (preferred backend should be explicit)
                    isClaimed = !!data[completedKey];
                }

                if (isClaimed) claimed.add(id);

                // Determine claimable
                let isClaimable = false;
                if (data && typeof data[claimableKey] !== "undefined") {
                    isClaimable = !!data[claimableKey];
                } else {
                    // Fallback: derive claimable from available stats if present
                    if (id === 1) {
                        // daily login: claimable if not claimed (perform_daily_check should reset claimed=false daily)
                        isClaimable = !isClaimed;
                    } else if (id === 2) {
                        const secs = data?.daily_exercise_seconds ?? 0;
                        isClaimable = !isClaimed && secs >= 600;
                    } else if (id === 3) {
                        const steps = data?.daily_steps ?? 0;
                        isClaimable = !isClaimed && steps >= 5000;
                    }
                }

                if (isClaimable) claimable.add(id);
            }

            setClaimedQuests(claimed);
            setClaimableQuests(claimable);
        } catch (error) {
            console.error("Failed to load daily quests:", error);
            toast.error("載入每日任務失敗");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadQuests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const handleClaimReward = async (questId: number) => {
        if (claiming !== null) return;

        setClaiming(questId);
        try {
            const result = await claimDailyQuest(userId, questId);
            if (result.success) {
                toast.success(`任務完成！💪 +${result.rewards.strength}, ⚡ +${result.rewards.stamina}, 😊 +${result.rewards.mood}`);
                // Mark as claimed locally and refresh state from server to be safe
                setClaimedQuests(prev => {
                    const newSet = new Set(prev);
                    newSet.add(questId); // add instead of delete
                    return newSet;
                });
                // Remove from claimable set if present
                setClaimableQuests(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(questId);
                    return newSet;
                });

                onQuestCompleted?.();

                // Refresh from backend to ensure consistency (recommended)
                await loadQuests();
            } else {
                // backend returned success:false with message
                toast.error(result.message || "領取失敗");
            }
        } catch (error) {
            console.error("Claim error:", error);
            toast.error("領取獎勵失敗");
        } finally {
            setClaiming(null);
        }
    };

    if (isLoading) {
        return (
            <Card className="p-4">
                <div className="text-center text-muted-foreground">載入中...</div>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                每日任務
            </h2>
            {DAILY_QUESTS.map((quest) => {
                const isClaimed = claimedQuests.has(quest.id);
                const isClaimable = claimableQuests.has(quest.id);

                return (
                    <Card key={quest.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                                {isClaimed ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                                )}

                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground">{quest.title}</h3>
                                    <p className="text-sm text-muted-foreground">{quest.description}</p>

                                    {/* 獎勵 */}
                                    <div className="mt-2 flex gap-2 text-xs">
                                        {quest.reward_strength > 0 && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                                💪 +{quest.reward_strength}
                                            </span>
                                        )}
                                        {quest.reward_stamina > 0 && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                ⚡ +{quest.reward_stamina}
                                            </span>
                                        )}
                                        {quest.reward_mood > 0 && (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                                😊 +{quest.reward_mood}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 領取按鈕 / 狀態 */}
                            {isClaimed ? (
                                <div className="text-sm text-green-600 font-medium">已領取</div>
                            ) : isClaimable ? (
                                <Button
                                    onClick={() => handleClaimReward(quest.id)}
                                    size="sm"
                                    disabled={claiming === quest.id}
                                    className="bg-green-500 hover:bg-green-600"
                                >
                                    {claiming === quest.id ? "領取中..." : "領取"}
                                </Button>
                            ) : (
                                <Button size="sm" disabled className="bg-gray-200 text-gray-500">
                                    未完成
                                </Button>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export default DailyQuests;
