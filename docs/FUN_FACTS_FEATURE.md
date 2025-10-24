# Fun Facts Feature - Planeerimine

## Ülevaade

Fun Facts on funktsionaalsus, mis lisab seriaali kaartide vahele huvitavaid fakte seriaali maailmast. See rikastab kasutajakogemust ja teeb sirvimise kaasahaaravamaks.

---

## 1. Funktsionaalsuse Kirjeldus

### 1.1 Põhiidee
- Iga 3-4 seriaali kaardi järel kuvatakse fun fact kaart
- Fun fact sisaldab huvitavat fakti seriaali maailmast
- Faktid võivad olla seotud konkreetse seriaaliga või üldised

### 1.2 Kasutajastsenaarium
```
[Show Card] → [Show Card] → [Show Card] → [Fun Fact Card] → [Show Card] → ...
```

### 1.3 Näited Fun Factidest
- "Breaking Bad'i peategelase nimi Walter White viitab luuletaja Walt Whitmanile"
- "Game of Thrones'i võtted kestsid 10 aastat ja hõlmasid 6 riiki"
- "Stranger Things'i Upside Down inspireeriti Stephen Kingi raamatutest"

---

## 2. Andmestruktuur

### 2.1 TypeScript Interface
```typescript
interface FunFact {
  id: string;                    // UUID
  text: string;                  // Fakti tekst (max 280 tähemärki)
  category?: string;             // Kategooria: "production", "trivia", "cast", "awards"
  relatedShowId?: string;        // Seotud seriaali ID (optional)
  relatedShowTitle?: string;     // Seriaali nimi (cache)
  isActive: boolean;             // Kas fakt on aktiivne
  displayOrder: number;          // Kuvamise järjekord
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Supabase Tabel
```sql
CREATE TABLE fun_facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL CHECK (char_length(text) <= 280),
  category VARCHAR(50),
  related_show_id UUID REFERENCES shows(id) ON DELETE SET NULL,
  related_show_title VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksid
CREATE INDEX idx_fun_facts_active ON fun_facts(is_active);
CREATE INDEX idx_fun_facts_order ON fun_facts(display_order);
CREATE INDEX idx_fun_facts_show ON fun_facts(related_show_id);

-- Trigger updated_at jaoks
CREATE TRIGGER update_fun_facts_updated_at
  BEFORE UPDATE ON fun_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Visuaalne Disain

### 3.1 Kaardi Struktuur
```
┌─────────────────────────────────────┐
│  💡 Fun Fact                        │
│                                     │
│  "Breaking Bad'i peategelase nimi   │
│  Walter White viitab luuletaja      │
│  Walt Whitmanile"                   │
│                                     │
│  #trivia #breakingbad               │
└─────────────────────────────────────┘
```

### 3.2 Disaini Elemendid
- **Ikoon**: 💡 või 🎬 või 📺
- **Taust**: Erinev värv tavalistest kaartidest (nt gradient või hele toon)
- **Tekst**: Keskendatud, loetav font
- **Kategooria tag**: Väike badge all nurgas
- **Animatsioon**: Fade-in efekt ilmumisel

### 3.3 Responsive Disain
- **Desktop**: Täislaiune kaart (sama laius kui 2 show kaarti)
- **Tablet**: Täislaiune kaart
- **Mobile**: Täislaiune kaart, väiksem padding

### 3.4 Design Tokens (järgides DESIGN_SYSTEM.md)
```typescript
const funFactStyles = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  textColor: 'var(--color-text-primary)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-6)',
  fontSize: 'var(--font-size-lg)',
  iconSize: '32px'
}
```

---

## 4. Komponendi Arhitektuur

### 4.1 Komponendi Hierarhia
```
ShowsList
├── ShowCard (x N)
├── FunFactCard (iga 4. kaardi järel)
├── ShowCard (x N)
└── FunFactCard
```

### 4.2 FunFactCard Komponent
```typescript
// src/components/shows/FunFactCard.tsx

interface FunFactCardProps {
  fact: FunFact;
  index?: number;
}

export function FunFactCard({ fact, index }: FunFactCardProps) {
  return (
    <div className="fun-fact-card">
      <div className="fun-fact-header">
        <span className="fun-fact-icon">💡</span>
        <h3>Fun Fact</h3>
      </div>
      
      <p className="fun-fact-text">{fact.text}</p>
      
      {fact.category && (
        <div className="fun-fact-footer">
          <span className="category-badge">#{fact.category}</span>
          {fact.relatedShowTitle && (
            <span className="show-badge">#{fact.relatedShowTitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
```

### 4.3 ShowsList Integratsioon
```typescript
// src/components/shows/ShowsList.tsx muudatused

const FUN_FACT_INTERVAL = 4; // Iga 4. kaardi järel

export function ShowsList({ shows }: ShowsListProps) {
  const [funFacts, setFunFacts] = useState<FunFact[]>([]);
  
  // Laadi fun facts
  useEffect(() => {
    loadFunFacts();
  }, []);
  
  return (
    <div className="shows-grid">
      {shows.map((show, index) => (
        <React.Fragment key={show.id}>
          <ShowCard show={show} />
          
          {/* Fun fact iga 4. kaardi järel */}
          {(index + 1) % FUN_FACT_INTERVAL === 0 && 
           funFacts[Math.floor(index / FUN_FACT_INTERVAL)] && (
            <FunFactCard 
              fact={funFacts[Math.floor(index / FUN_FACT_INTERVAL)]} 
              index={index}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
```

---

## 5. API & Andmete Haldus

### 5.1 API Endpointid

#### GET /api/fun-facts
```typescript
// Tagastab kõik aktiivsed fun facts
GET /api/fun-facts?limit=10&offset=0

Response:
{
  facts: FunFact[],
  total: number
}
```

#### GET /api/fun-facts/random
```typescript
// Tagastab juhuslikud N fakti
GET /api/fun-facts/random?count=5

Response:
{
  facts: FunFact[]
}
```

#### POST /api/fun-facts (Admin)
```typescript
// Loo uus fun fact
POST /api/fun-facts
Body: {
  text: string,
  category?: string,
  relatedShowId?: string
}
```

#### PUT /api/fun-facts/:id (Admin)
```typescript
// Uuenda fun facti
PUT /api/fun-facts/:id
Body: Partial<FunFact>
```

#### DELETE /api/fun-facts/:id (Admin)
```typescript
// Kustuta fun fact
DELETE /api/fun-facts/:id
```

### 5.2 Supabase Funktsioonid
```typescript
// src/lib/funFacts.ts

export async function getFunFacts(limit = 10): Promise<FunFact[]> {
  const { data, error } = await supabase
    .from('fun_facts')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(limit);
    
  if (error) throw error;
  return data;
}

export async function getRandomFunFacts(count = 5): Promise<FunFact[]> {
  // Implementeeri random selection
  const { data, error } = await supabase
    .from('fun_facts')
    .select('*')
    .eq('is_active', true);
    
  if (error) throw error;
  
  // Shuffle ja võta N esimest
  return shuffleArray(data).slice(0, count);
}

export async function createFunFact(fact: Omit<FunFact, 'id' | 'createdAt' | 'updatedAt'>): Promise<FunFact> {
  const { data, error } = await supabase
    .from('fun_facts')
    .insert(fact)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

---

## 6. Admin Liides

### 6.1 Admin Panel Struktuur
```
/admin/fun-facts
├── List View (kõik faktid)
├── Create Form (uue fakti loomine)
├── Edit Form (fakti muutmine)
└── Delete Confirmation
```

### 6.2 Admin Komponendid

#### FunFactsAdmin.tsx
```typescript
// src/components/admin/FunFactsAdmin.tsx

export function FunFactsAdmin() {
  const [facts, setFacts] = useState<FunFact[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  return (
    <div className="admin-panel">
      <header>
        <h1>Fun Facts Management</h1>
        <button onClick={() => setIsCreating(true)}>
          + Add New Fun Fact
        </button>
      </header>
      
      <FunFactsList 
        facts={facts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />
      
      {isCreating && (
        <FunFactForm 
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}
```

#### FunFactForm.tsx
```typescript
// src/components/admin/FunFactForm.tsx

interface FunFactFormProps {
  fact?: FunFact;
  onSubmit: (fact: Partial<FunFact>) => void;
  onCancel: () => void;
}

export function FunFactForm({ fact, onSubmit, onCancel }: FunFactFormProps) {
  return (
    <form onSubmit={handleSubmit}>
      <textarea 
        name="text"
        placeholder="Enter fun fact (max 280 characters)"
        maxLength={280}
        required
      />
      
      <select name="category">
        <option value="">Select category</option>
        <option value="production">Production</option>
        <option value="trivia">Trivia</option>
        <option value="cast">Cast</option>
        <option value="awards">Awards</option>
      </select>
      
      <input 
        type="text"
        name="relatedShowTitle"
        placeholder="Related show (optional)"
      />
      
      <div className="form-actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
```

### 6.3 Admin Õigused
- Ainult autenditud kasutajad
- Võimalik lisada role-based access (admin role)
- Supabase RLS policies

---

## 7. Kuvamise Loogika

### 7.1 Algoritm

**Variant 1: Fikseeritud Intervall (SOOVITATUD)**
```typescript
const FUN_FACT_INTERVAL = 4;

// Iga 4. kaardi järel kuva fun fact
if ((index + 1) % FUN_FACT_INTERVAL === 0) {
  showFunFact();
}
```

**Variant 2: Dünaamiline**
```typescript
// Juhuslik intervall 3-5 kaardi vahel
const getNextInterval = () => Math.floor(Math.random() * 3) + 3;
```

### 7.2 Fun Factide Rotatsioon
- Laadi korraga N fakti (nt 10)
- Kuva neid järjekorras
- Kui faktid otsa saavad, laadi uued
- Võimalus shuffle'ida järjekorda

### 7.3 Caching
```typescript
// Cache fun facts localStorage'is
const CACHE_KEY = 'fun_facts_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

function getCachedFunFacts(): FunFact[] | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  
  const { facts, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    return null;
  }
  
  return facts;
}
```

---

## 8. Testimine

### 8.1 Unit Testid
```typescript
// FunFactCard.test.tsx
describe('FunFactCard', () => {
  it('renders fact text correctly', () => {});
  it('displays category badge when provided', () => {});
  it('shows related show title when available', () => {});
});

// funFacts.test.ts
describe('getFunFacts', () => {
  it('returns active facts only', () => {});
  it('respects limit parameter', () => {});
  it('orders by display_order', () => {});
});
```

### 8.2 Integration Testid
```typescript
describe('ShowsList with Fun Facts', () => {
  it('displays fun fact after every 4th show card', () => {});
  it('handles empty fun facts gracefully', () => {});
  it('loads more fun facts when scrolling', () => {});
});
```

### 8.3 E2E Testid
- Kasutaja näeb fun facte sirvides
- Admin saab lisada uusi facte
- Admin saab muuta olemasolevaid facte
- Fun factid kuvatakse õiges intervallis

---

## 9. Implementatsiooni Sammud

### Faas 1: Andmebaas & API
- [ ] Loo `fun_facts` tabel Supabase'is
- [ ] Loo RLS policies
- [ ] Implementeeri API funktsioonid (`src/lib/funFacts.ts`)
- [ ] Testi API endpointid

### Faas 2: UI Komponendid
- [ ] Loo `FunFactCard` komponent
- [ ] Lisa stiilid (CSS/Tailwind)
- [ ] Integreeri `ShowsList`'i
- [ ] Testi responsive disaini

### Faas 3: Admin Liides
- [ ] Loo admin panel struktuur
- [ ] Implementeeri CRUD operatsioonid
- [ ] Lisa validatsioon
- [ ] Testi admin funktsionaalsust

### Faas 4: Optimeerimine
- [ ] Lisa caching
- [ ] Optimeeri päringud
- [ ] Lisa loading states
- [ ] Testi jõudlust

### Faas 5: Testimine & Deploy
- [ ] Kirjuta unit testid
- [ ] Kirjuta integration testid
- [ ] Tee E2E testimine
- [ ] Deploy production'i

---

## 10. Tulevased Täiustused

### 10.1 V2 Features
- **Kasutaja interaktsioon**: Like/dislike fun factidele
- **Jagamine**: Jaga fun facti social media's
- **Filtreerimine**: Filtreeri facte kategooriate järgi
- **Personaliseeritud faktid**: Näita facte kasutaja vaadatud seriaalide kohta

### 10.2 Analytics
- Jälgi, milliseid facte kõige rohkem vaadatakse
- Mõõda engagement rate'i
- Optimeeri faktide sisu analytics põhjal

### 10.3 Automatiseerimine
- AI-genereeritud faktid (OpenAI API)
- Automaatne import TMDB/IMDB trivia'st
- Scheduled updates

---

## 11. Tehnilised Kaalutlused

### 11.1 Jõudlus
- Fun factide laadimine ei tohi aeglustada põhisisu
- Kasuta lazy loading'ut
- Cache faktid agressiivselt

### 11.2 Accessibility
- Proper ARIA labels
- Keyboard navigation
- Screen reader support

### 11.3 SEO
- Fun factid võivad olla indexeeritud
- Structured data markup
- Meta tags

### 11.4 Turvalisus
- Sanitize user input (XSS prevention)
- Rate limiting admin endpoints
- Proper authentication & authorization

---

## 12. Ressursid & Viited

### 12.1 Dokumentatsioon
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Disaini süsteem
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Projekti staatus
- Supabase dokumentatsioon

### 12.2 Inspiratsioon
- Netflix "Did you know?" faktid
- IMDb trivia sektsioon
- Spotify "Behind the Lyrics"

---

## Kokkuvõte

Fun Facts funktsioon lisab rakendusele harivat ja kaasahaaravat elementi. Implementatsioon on lihtne, kuid võimaldab tulevikus palju täiustusi. Alustame lihtsast versioonist ja arendame edasi kasutajate tagasiside põhjal.

**Järgmine samm**: Arutame läbi detailid ja alustame implementeerimist Faas 1'st.