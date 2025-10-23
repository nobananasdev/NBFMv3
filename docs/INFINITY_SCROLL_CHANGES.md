# Infinity Scroll Optimiseerimise Muudatused

## ⚠️ TÄHTIS: Need muudatused EI TOHI minna GitHubi!

Järgnevad failid sisaldavad eksperimentaalseid infinity scroll optimiseerimisi, mis võivad mõjutada lehe stabiilsust.

## 🔴 PEAMISED INFINITY SCROLL MUUDATUSED (MITTE COMMITIDA):

### 1. `src/components/sections/DiscoverSection.tsx`
**Muudatused:**
- ✅ Lisatud `preloadedShows`, `isPreloading`, `preloadNext` useDiscoverShows hook-ist
- ✅ Lisatud `preloadObserverRef` - varajane preload trigger
- ✅ Lisatud `handlePreloadObserver` - käivitab preload 800px enne lõppu
- ✅ Lisatud preload trigger element (position: absolute, bottom: 60vh)
- ✅ Lisatud kolm erinevat loading state'i:
  - Loading more shows (tavaline loading)
  - Preparing next shows (preloading)
  - Next shows ready (preload valmis)
- ✅ Lisatud console.log debug info preload ja infinite scroll jaoks

### 2. `src/hooks/useShows.ts`
**Muudatused:**
- ✅ Lisatud `preloadedShows: ShowWithGenres[]` state
- ✅ Lisatud `isPreloading: boolean` state  
- ✅ Lisatud `preloadNext()` funktsioon
- ✅ Muudetud `fetchShowsData` - lisatud `isPreload` parameeter
- ✅ Lisatud keerukas offset kalkulatsioon preload jaoks
- ✅ Lisatud preloaded shows kasutamise loogika
- ✅ Lisatud console.log debug info
- ✅ Muudetud kõik helper hook-id (useDiscoverShows, useWatchlistShows jne)

### 3. `src/lib/shows.ts`
**Muudatused:**
- ✅ Muudetud fetch limit kalkulatsioon (vähem over-fetch)
- ✅ Lisatud proper offset support URL-is
- ✅ Optimiseeritud filtering loogika
- ✅ Lisatud `hasMore` logic return value-sse

## 🟡 ANIMATSIOONI MUUDATUSED (VÕIB COMMITIDA ERALDI):

### 4. `src/app/globals.css`
**Muudatused:**
- ✅ Lisatud `.animate-fade-in`, `.animate-success-bounce`, `.animate-slide-up`
- ✅ Lisatud @keyframes: `fadeIn`, `successBounce`, `slideUp`
- ✅ Muudetud card hover scale 1.02 -> 1.005 (vähem aggressive)

## 🟢 FAILID, MIS VÕIVAD OLLA MUUDETUD, AGA EI OLE INFINITY SCROLL SEOTUD:

Need failid võivad sisaldada muid muudatusi (bug fixes, UI improvements), mis EI OLE seotud infinity scroll-iga:

- `src/components/sections/NewSeasonsSection.tsx`
- `src/components/sections/RatedSection.tsx`  
- `src/components/sections/WatchlistSection.tsx`
- `src/components/shows/ShowCard.tsx`
- `src/components/shows/ShowsList.tsx`

## 📋 SOOVITUSED:

### GitHubi Commitimiseks:
1. **ESMALT** - kontrolli teisi faile (`git diff filename`) 
2. **COMMIT AINULT** - failid, mis EI OLE infinity scroll seotud
3. **ÄRA COMMITI** - DiscoverSection.tsx, useShows.ts, shows.ts muudatusi

### Infinity Scroll Muudatuste Haldamiseks:
```bash
# Loo eraldi branch infinity scroll jaoks
git checkout -b infinity-scroll-optimization

# Või kasuta git stash
git stash push -m "infinity scroll changes" src/components/sections/DiscoverSection.tsx src/hooks/useShows.ts src/lib/shows.ts

# Taasta muudatused hiljem
git stash pop
```

## 🎯 PRAEGUNE OLUKORD:

- ✅ Leht töötab stabiilselt
- ✅ Preload süsteem toimib (console logid näitavad)
- ✅ Infinity scroll on optimiseeritud
- ⚠️ Muudatused on eksperimentaalsed - võivad vajada täiendamist

## 🔄 TAGASIPÖÖRAMINE:

Kui tahad täielikult tagasi pöörata originaali:
```bash
git checkout HEAD -- src/components/sections/DiscoverSection.tsx src/hooks/useShows.ts src/lib/shows.ts