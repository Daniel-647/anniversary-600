/* ========================================
   Data Loader — Fetches & caches all content JSON
   ======================================== */

const DataLoader = (function () {
  'use strict';

  let chapters = [];
  let photos = [];
  let jsonPhotos = [];
  let remotePhotos = [];
  let memories = [];
  let isLoaded = false;
  let loadError = null;
  const relationshipStartDate = { year: 2024, monthIndex: 8, day: 21 };
  const dayMs = 24 * 60 * 60 * 1000;

  async function loadAll() {
    if (isLoaded) return true;
    try {
      const [cR, pR, mR] = await Promise.all([
        fetch('data/chapters.json'),
        fetch('data/photos.json'),
        fetch('data/memories.json'),
      ]);
      if (!cR.ok && !pR.ok && !mR.ok) throw new Error('All data files unavailable');
      
      if (cR.ok) { const d = await cR.json(); chapters = d.chapters || []; }
      if (pR.ok) { const d = await pR.json(); jsonPhotos = d.photos || []; photos = mergePhotos(); }
      if (mR.ok) { const d = await mR.json(); memories = d.memories || []; }
      
      chapters.sort((a, b) => a.order - b.order);
      photos = mergePhotos();
      memories.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      isLoaded = true;
      console.log('[DataLoader] Loaded:', chapters.length, 'chapters,', photos.length, 'photos,', memories.length, 'memories');
      return true;
    } catch (err) {
      loadError = err;
      console.warn('[DataLoader] Fetch failed, using fallback:', err.message);
      useFallback();
      isLoaded = true;
      return true;
    }
  }

  function useFallback() {
    chapters = [
      {id:"uncertain-beginning",order:1,title:"开始",subtitle:"面对一切都不确定的未来，我们选择开始",description:"那时候谁也不知道会走多远。",theme:"cold",hasPhotos:false,startText:"故事的开头，充满了问号。",endText:"但我们还是选择了出发。",chatBubbles:[{type:"received",text:"其实我对未来一点把握都没有。"},{type:"sent",text:"我也是。但我想试试看。"},{type:"received",text:"你真的这么想？"},{type:"sent",text:"嗯。我们试试看吧。"}],floatingWords:["不确定","迷茫","勇敢","试试看"]},
      {id:"growing-clear",order:2,title:"坚定",subtitle:"在无数次对话和争吵中，未来渐渐清晰",description:"我们争吵过，冷战过，但每一次拉扯之后都更确定。",theme:"dark",hasPhotos:false,startText:"有一段时间，我们都差点放弃。",endText:"但每一次破碎后的重组，都让我们的形状更加契合。",struggleLines:["我们争吵过。","在深夜的电话里沉默不语。","删掉聊天记录又偷偷找回。","那一次次激烈的对话，反而让我们的轮廓越来越清晰。","答案是：很重要。"],transitionText:"争吵过后，光开始慢慢变暖。"},
      {id:"nanjing",order:3,title:"金陵",subtitle:"金陵城，或许算是一个转折点",description:"那个冬天，我们在南京。第一次觉得，这就是对的人。",theme:"warm",hasPhotos:false,startText:"南京的冬天很冷。",endText:"从金陵城开始，一切都不一样了。",quote:"金陵城的冬天很冷，但和你在一起的时候，我第一次觉得冬天可以这么温暖。",timelineNodes:[{label:"初雪",position:15},{label:"秦淮河",position:30},{label:"夫子庙",position:47},{label:"玄武湖",position:64},{label:"老门东",position:78},{label:"约定",position:92}],hasSnow:true},
      {id:"announcement",order:4,title:"官宣",subtitle:"我们官宣啦",description:"终于可以大声告诉所有人，我们在一起了。",theme:"golden",hasPhotos:false,startText:"憋了很久的话，终于可以说出来了。",endText:"全世界都知道，你是我的。",announcementText:"我们在一起了。",announcementDate:"2024",floatingWords:["温暖","确定","心安"],hasBloomLights:true},
      {id:"good-times-1",order:5,title:"美好时光",subtitle:"Chapter 1 · 在一起的每一天都是礼物",description:"一起走过的日常，才是最美的浪漫。",theme:"golden",hasPhotos:false,startText:"日常里的每一刻，都是属于我们的美好。",endText:"这些看似平凡的日子，回头看全是宝藏。",hasBloomLights:true},
      {id:"unexpected-challenge",order:6,title:"意外",subtitle:"猝不及防的意外，但还是选择坚定走下去",description:"生活不会一直温柔。那段突如其来的意外，像一道裂缝横在我们面前。",theme:"dark",hasPhotos:false,startText:"有些事情来得毫无预兆。",endText:"但意外没有把我们分开。",struggleLines:["那段日子，我们都很害怕。","不知道未来会怎样。","但每一次看向对方，眼睛里说的都是同一句话。","我不会放手。","我们一起面对。"],transitionText:"然后我们真的做到了，一起走了过来。"},
      {id:"good-times-2",order:7,title:"美好时光",subtitle:"Chapter 2 · 走过风雨后的晴天，格外珍贵",description:"经历过风雨之后，每一个平凡的日子都闪闪发光。",theme:"golden",hasPhotos:false,startText:"风雨过后，阳光格外温暖。",endText:"后来的每一天，都像被镀上了一层温柔的光。",hasBloomLights:true},
      {id:"now",order:8,title:"现在",subtitle:"600 天 · 此刻即是最好的时光",description:"回头看，每一步都算数。600 天，我们走到了这里。",theme:"deep-gold",hasPhotos:false,startText:"600 天，不长不短。",endText:"而故事还在继续。",endingQuote:"故事还在继续。",endingSubtext:"谢谢你，陪我走过这 600 天。",isBento:true}
    ];
    jsonPhotos = [];
    remotePhotos = [];
    photos = [];
    memories = [];
    console.log('[DataLoader] Fallback ready:', chapters.length, 'chapters');
  }

  // Query functions
  function mergePhotos() {
    const local = jsonPhotos.map((photo, index) => ({ ...photo, remote: false, sortOrder: photo.sortOrder ?? index + 1 }));
    const remote = remotePhotos.map((photo, index) => ({ ...photo, remote: true, sortOrder: photo.sortOrder ?? index + 1 }));

    return [...local, ...remote].sort((a, b) => {
      if (a.chapter !== b.chapter) return a.chapter.localeCompare(b.chapter);
      if (!a.remote && b.remote) return -1;
      if (a.remote && !b.remote) return 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }

  function setRemotePhotos(newRemotePhotos) {
    remotePhotos = Array.isArray(newRemotePhotos) ? newRemotePhotos : [];
    photos = mergePhotos();
  }

  function addRemotePhoto(photo) {
    if (!photo) return;
    remotePhotos = remotePhotos.filter((item) => item.id !== photo.id).concat(photo);
    photos = mergePhotos();
  }

  function getAllChapters() { return chapters; }
  function getChapterById(id) { return chapters.find(c => c.id === id) || null; }
  function getAllPhotos() { return photos; }
  function getPhotosByChapter(cid) { return photos.filter(p => p.chapter === cid); }
  function getHeroPhotoForChapter(cid) { return getPhotosByChapter(cid).find(p => p.displayType === 'hero') || getPhotosByChapter(cid)[0] || null; }
  function getBackgroundPhotoForChapter(cid) { return photos.find(p => p.chapter === cid && p.displayType === 'background') || null; }
  function getAllMemories() { return memories; }
  function getMemoriesByChapter(cid) { return memories.filter(m => m.chapter === cid); }
  function getHighImportanceMemories() { return memories.filter(m => m.importance === 'high'); }
  function getRelationshipDays(now = new Date()) {
    const start = Date.UTC(
      relationshipStartDate.year,
      relationshipStartDate.monthIndex,
      relationshipStartDate.day
    );
    const current = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(1, Math.floor((current - start) / dayMs) + 1);
  }
  function getDashboardStats() {
    const cities = new Set(photos.map(p => p.location).filter(Boolean));
    return { totalDays: getRelationshipDays(), seasons: 4, cities: cities.size, photos: photos.length, memories: memories.length, highMoments: memories.filter(m => m.importance === 'high').length };
  }
  function getStatus() { return { isLoaded, loadError }; }

  const listeners = [];
  function onReady(cb) { if (isLoaded) cb(); else listeners.push(cb); }
  function _notifyReady() { listeners.forEach(fn => fn()); listeners.length = 0; }

  const _orig = loadAll;
  loadAll = async function() { const r = await _orig(); if (r) _notifyReady(); return r; };

  return { loadAll, onReady, getStatus, getAllChapters, getChapterById, getAllPhotos, getPhotosByChapter, getHeroPhotoForChapter, getBackgroundPhotoForChapter, getAllMemories, getMemoriesByChapter, getHighImportanceMemories, getRelationshipDays, getDashboardStats, setRemotePhotos, addRemotePhoto };
})();

window.DataLoader = DataLoader;
