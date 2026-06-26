import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useEconomyStore } from '../stores/economyStore';
import { useProfileStore } from '../stores/profileStore';
import { ShopItem } from '../components/play/ShopItem';
import type { InventoryItem } from '../types';

const SHOP_ITEMS: { item: Omit<InventoryItem, 'count'>; cost: number }[] = [
  { item: { id: 'skin-hero', name: '小勇士皮肤', type: 'skin', icon: '🦸' }, cost: 50 },
  { item: { id: 'skin-pet', name: '宠物皮肤', type: 'skin', icon: '🐶' }, cost: 60 },
  { item: { id: 'effect-star', name: '星星特效', type: 'effect', icon: '✨' }, cost: 40 },
  { item: { id: 'furniture-desk', name: '学习书桌', type: 'furniture', icon: '📚' }, cost: 80 },
  { item: { id: 'furniture-lamp', name: '小台灯', type: 'furniture', icon: '🛋️' }, cost: 45 },
  { item: { id: 'pet-food', name: '宠物饼干', type: 'pet_food', icon: '🍪' }, cost: 15 }
];

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
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/play"
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold">虚拟商城</h2>
        <div className="ml-auto flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-yellow-600 shadow-sm">
          <Star className="h-4 w-4 fill-current" />
          <span className="font-bold">{profile.stars}</span>
        </div>
      </div>

      {!loaded ? (
        <div className="card py-12 text-center text-slate-500">加载商城中…</div>
      ) : (
        <>
          <div className="card flex items-center justify-between bg-amber-50">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SHOP_ITEMS.map(({ item, cost }) => (
              <ShopItem
                key={item.id}
                item={item}
                cost={cost}
                canAfford={profile.stars >= cost}
                onBuy={handleBuy}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
