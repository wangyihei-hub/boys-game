import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Sparkles } from 'lucide-react';
import { useEconomyStore } from '../stores/economyStore';
import { useProfileStore } from '../stores/profileStore';
import { ShopItem } from '../components/play/ShopItem';
import { EQUIPMENT_CATALOG } from '../services/equipmentLogic';
import { PET_CATALOG } from '../services/petLogic';
import type { InventoryItem } from '../types';

interface ShopEntry {
  item: Omit<InventoryItem, 'count'>;
  cost: number;
  description?: string;
  levelReq?: number;
}

interface ShopSection {
  title: string;
  items: ShopEntry[];
}

const COSMETIC_ITEMS: ShopEntry[] = [
  { item: { id: 'skin-hero', name: '小勇士皮肤', type: 'skin', icon: '🦸' }, cost: 50 },
  { item: { id: 'skin-pet', name: '宠物皮肤', type: 'skin', icon: '🐶' }, cost: 60 },
  { item: { id: 'effect-star', name: '星星特效', type: 'effect', icon: '✨' }, cost: 40 }
];

const FURNITURE_ITEMS: ShopEntry[] = [
  { item: { id: 'furniture-desk', name: '学习书桌', type: 'furniture', icon: '📚' }, cost: 80 },
  { item: { id: 'furniture-lamp', name: '小台灯', type: 'furniture', icon: '🛋️' }, cost: 45 }
];

const FOOD_ITEMS: ShopEntry[] = [
  { item: { id: 'pet-food', name: '宠物饼干', type: 'pet_food', icon: '🍪' }, cost: 15 }
];

function buildEquipmentSection(): ShopSection {
  return {
    title: '装备',
    items: EQUIPMENT_CATALOG.map(def => ({
      item: {
        id: def.id,
        name: def.name,
        type: 'equipment',
        icon: def.icon,
        slot: def.slot,
        attackBonus: def.attackBonus,
        hpBonus: def.hpBonus,
        critBonus: def.critBonus,
        timeBonus: def.timeBonus
      },
      cost: def.starCost ?? 0,
      description: `需要等级 Lv.${def.level} · ${def.description}`,
      levelReq: def.level
    }))
  };
}

function buildPetSection(): ShopSection {
  return {
    title: '宠物',
    items: PET_CATALOG.map(def => ({
      item: {
        id: def.id,
        name: def.name,
        type: 'pet',
        icon: def.icon,
        petDefId: def.id,
        evolutionStage: 0,
        bond: 0
      },
      cost: def.starCost ?? 0,
      description: def.skillDescription
    }))
  };
}

export function Shop() {
  const profile = useProfileStore(state => state.profile);
  const inventory = useEconomyStore(state => state.inventory);
  const loadEconomyData = useEconomyStore(state => state.loadEconomyData);
  const buyShopItem = useEconomyStore(state => state.buyShopItem);
  const synthesizeFragment = useEconomyStore(state => state.synthesizeFragment);
  const loaded = useEconomyStore(state => state.loaded);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);

  useEffect(() => {
    loadEconomyData();
  }, [loadEconomyData]);

  const fragmentCount = inventory.find(i => i.id === 'fragment')?.count ?? 0;

  const sections: ShopSection[] = [
    buildEquipmentSection(),
    buildPetSection(),
    { title: '饲料', items: FOOD_ITEMS },
    { title: '装扮', items: COSMETIC_ITEMS },
    { title: '家具', items: FURNITURE_ITEMS }
  ];

  const handleBuy = async (item: Omit<InventoryItem, 'count'>, cost: number) => {
    if (processingId) return;
    setProcessingId(item.id);
    try {
      await buyShopItem(item, cost);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSynthesize = async () => {
    if (synthesizing || fragmentCount < 5) return;
    setSynthesizing(true);
    try {
      await synthesizeFragment();
    } finally {
      setSynthesizing(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="scene-shop -mx-2 -mt-2 min-h-full rounded-t-3xl p-3 sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="glass-card flex items-center gap-3">
          <Link
            to="/play"
            className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h2 className="text-xl font-bold">虚拟商城</h2>
            <p className="text-xs text-slate-500">欢迎来到小勇士补给站</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-white/80 px-3 py-1.5 text-yellow-600 shadow-sm">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-bold">{profile.stars}</span>
          </div>
        </div>

        {!loaded ? (
          <div className="glass-card py-12 text-center text-slate-500">加载商城中…</div>
        ) : (
          <>
            <div className="glass-card flex items-center justify-between bg-amber-50/80">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  🧩
                </div>
                <div>
                  <p className="font-bold text-slate-800">实物碎片</p>
                  <p className="text-xs text-slate-500">收集 5 个可合成餐饮兑换券</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-700">{fragmentCount}</p>
                <button
                  type="button"
                  onClick={handleSynthesize}
                  disabled={fragmentCount < 5 || synthesizing}
                  className="mt-1 rounded-lg bg-amber-200 px-3 py-1 text-xs font-bold text-amber-800 disabled:opacity-50"
                >
                  {synthesizing ? '合成中…' : '合成'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {sections.map(section => (
                <section key={section.title} className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-700">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {section.items.map(entry => {
                      const ownable = entry.item.type === 'equipment' || entry.item.type === 'pet';
                      const owned = ownable && inventory.some(i => i.id === entry.item.id);
                      const levelLocked = entry.levelReq ? profile.level < entry.levelReq : false;
                      const disabled = owned || levelLocked;
                      const buttonText = owned
                        ? '已拥有'
                        : levelLocked
                          ? `需要等级 Lv.${entry.levelReq}`
                          : undefined;

                      return (
                        <ShopItem
                          key={entry.item.id}
                          item={entry.item}
                          cost={entry.cost}
                          canAfford={profile.stars >= entry.cost}
                          disabled={disabled}
                          buttonText={buttonText}
                          badge={owned ? '已拥有' : undefined}
                          description={entry.description}
                          onBuy={handleBuy}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
