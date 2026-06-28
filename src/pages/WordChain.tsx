import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, RotateCcw, Send } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { useEconomyStore } from '../stores/economyStore';
import { getRandomStartWord, findChainResponse, isValidChainWord, WORD_DICTIONARY } from '../services/wordDictionary';
import { playSound } from '../services/soundService';

const STARS_PER_CHAIN = 1;
const STARS_BONUS_10 = 5;

export function WordChain() {
  const incrementMinigameStat = useProfileStore(state => state.incrementMinigameStat);
  const grantMinigameReward = useEconomyStore(state => state.grantMinigameReward);

  const [currentWord, setCurrentWord] = useState('');
  const [input, setInput] = useState('');
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [chainCount, setChainCount] = useState(0);
  const [messages, setMessages] = useState<{ text: string; isPlayer: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = useCallback(() => {
    const start = getRandomStartWord();
    setCurrentWord(start);
    setInput('');
    setUsedWords(new Set([start]));
    setChainCount(0);
    setMessages([{ text: start, isPlayer: false }]);
    setFinished(false);
    setRewarded(false);
    setError(null);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (finished && !rewarded) {
      setRewarded(true);
      playSound('win');
      const stars = chainCount * STARS_PER_CHAIN + (chainCount >= 10 ? STARS_BONUS_10 : 0);
      if (stars > 0) {
        grantMinigameReward({ type: 'stars', amount: stars });
      }
      incrementMinigameStat('wordChainCount', chainCount);
    }
  }, [finished, rewarded, chainCount, grantMinigameReward, incrementMinigameStat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finished || !input.trim()) return;

    const word = input.trim();
    if (!isValidChainWord(currentWord, word, usedWords)) {
      playSound('wrong');
      if (!WORD_DICTIONARY.includes(word)) {
        setError('这个词不在词库中，换个试试吧');
      } else if (usedWords.has(word)) {
        setError('这个词已经用过了');
      } else {
        setError(`请输入以「${currentWord.slice(-1)}」开头的词`);
      }
      return;
    }

    playSound('click');
    setError(null);
    const nextUsed = new Set(usedWords).add(word);
    setUsedWords(nextUsed);
    setMessages(prev => [...prev, { text: word, isPlayer: true }]);
    setCurrentWord(word);
    setInput('');
    setChainCount(c => c + 1);

    // AI response
    const response = findChainResponse(word);
    if (!response || nextUsed.has(response)) {
      setMessages(prev => [...prev, { text: '我接不上啦，你赢了！', isPlayer: false }]);
      setFinished(true);
    } else {
      setTimeout(() => {
        const aiUsed = new Set(nextUsed).add(response);
        setUsedWords(aiUsed);
        setMessages(prev => [...prev, { text: response, isPlayer: false }]);
        setCurrentWord(response);

        const playerNext = findChainResponse(response);
        if (!playerNext || aiUsed.has(playerNext)) {
          setMessages(prev => [...prev, { text: '你好像接不上啦，游戏结束。', isPlayer: false }]);
          setFinished(true);
        }
      }, 600);
    }
  };

  return (
    <div className="scene-camp -mx-2 -mt-2 min-h-full rounded-t-3xl p-3 sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="glass-card flex items-center gap-3">
          <Link to="/play/arcade" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">词语接龙</h2>
            <p className="text-xs text-slate-500">用你的词语打败电脑</p>
          </div>
          <button
            onClick={startGame}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition active:scale-95"
            aria-label="重新开始"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        <div className="glass-card flex items-center justify-between text-sm font-semibold text-slate-700">
          <span>已接龙 {chainCount} 次</span>
          <span className="text-xs text-slate-500">当前：{currentWord}</span>
        </div>

        <div className="glass-card h-80 space-y-2 overflow-y-auto p-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={[
                'flex w-full',
                msg.isPlayer ? 'justify-end' : 'justify-start'
              ].join(' ')}
            >
              <div
                className={[
                  'max-w-[70%] rounded-2xl px-4 py-2 text-sm font-semibold',
                  msg.isPlayer
                    ? 'rounded-tr-sm bg-indigo-500 text-white'
                    : 'rounded-tl-sm bg-white text-slate-700'
                ].join(' ')}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {!finished ? (
          <form onSubmit={handleSubmit} className="glass-card space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>请输入以</span>
              <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-indigo-700">{currentWord.slice(-1)}</span>
              <span>开头的两字词</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="输入词语"
                maxLength={4}
                className="flex-1 rounded-xl border-2 border-indigo-100 bg-white/70 px-4 py-3 text-lg font-bold text-slate-800 outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm transition active:scale-95"
                aria-label="发送"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
          </form>
        ) : (
          <div className="glass-card space-y-3 text-center">
            <h3 className="text-xl font-bold text-slate-800">游戏结束</h3>
            <p className="text-slate-600">你成功接龙 <span className="text-2xl font-bold text-indigo-600">{chainCount}</span> 次</p>
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              <span>+{chainCount * STARS_PER_CHAIN + (chainCount >= 10 ? STARS_BONUS_10 : 0)} 星星</span>
            </div>
            <button onClick={startGame} className="btn-primary w-full text-sm">
              再玩一次
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
