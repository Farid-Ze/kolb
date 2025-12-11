# D4-03: Viral Content & Shareability Guide

## 📋 METADATA
- **Task ID**: D4-03
- **Persona**: Dinda Pratiwi (Social Media & Mobile Specialist)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: D2-01, D2-03, D3-03

---

## 🎯 OBJECTIVE

Provide guidelines for creating shareable content and maximizing viral potential for Zenotika WebGL experiential projects.

---

## 🔥 VIRAL CONTENT GUIDE

### 1. Shareability Psychology

#### Why People Share

| Driver | Description | Content Strategy |
|--------|-------------|------------------|
| **Social Currency** | Look knowledgeable | Insider info, stats |
| **Triggers** | Top-of-mind | Current trends |
| **Emotion** | Feel something | Awe, surprise, joy |
| **Public** | Visible to others | Shareable badges |
| **Practical Value** | Useful to others | How-tos, tips |
| **Stories** | Narrative form | Behind-the-scenes |

> Based on "Contagious" by Jonah Berger (STEPPS Framework)

### 2. Shareable Content Formats

#### High-Performing Content Types

| Format | Shareability | Best Platform | Example |
|--------|--------------|---------------|---------|
| Short Video (15-30s) | ⭐⭐⭐⭐⭐ | TikTok, Reels | Wow moment clip |
| Before/After | ⭐⭐⭐⭐⭐ | All | Transformation |
| Behind the Scenes | ⭐⭐⭐⭐ | Instagram, LinkedIn | Process video |
| Data Visualization | ⭐⭐⭐⭐ | LinkedIn, Twitter | Infographic |
| Tutorial Snippet | ⭐⭐⭐⭐ | YouTube, TikTok | How we made it |
| User Reaction | ⭐⭐⭐⭐ | TikTok, Instagram | First reactions |
| Thread/Carousel | ⭐⭐⭐ | Twitter, LinkedIn | Deep dive |

### 3. Viral Hooks Framework

#### Opening Hook Templates

| Type | Template | Example |
|------|----------|---------|
| **Curiosity** | "Most people don't know..." | "Most people don't know WebGL can do this..." |
| **Contrarian** | "[Topic] is [unexpected take]" | "3D websites are overrated—here's why we built one anyway" |
| **Numbers** | "[Specific number] [result]" | "This took 2,000 hours to build. Here's the 30-second version" |
| **Question** | "Ever wondered how [thing]?" | "Ever wondered how they made that spinning corn?" |
| **Promise** | "How to [achieve result]" | "How to create this effect without writing code" |
| **Emotion** | "[Emotion] when [situation]" | "That feeling when you finally see your 3D model render" |

#### Content Structure for Virality

```
VIRAL CONTENT STRUCTURE
├── HOOK (0-3 seconds)
│   └── Stop the scroll, create curiosity
│
├── BUILD (3-15 seconds)
│   └── Context, rising interest
│
├── PEAK (15-25 seconds)
│   └── Wow moment, payoff
│
└── CTA (25-30 seconds)
    └── Follow, visit, share
```

### 4. Platform-Specific Viral Strategies

#### TikTok/Reels

| Strategy | Implementation |
|----------|----------------|
| Trend participation | Use trending sounds/formats |
| Duet/Stitch | React to related content |
| Challenge creation | Branded challenge |
| Comment engagement | Reply with video |

#### LinkedIn

| Strategy | Implementation |
|----------|----------------|
| Thought leadership | Industry insights |
| Data stories | Research findings |
| Founder journey | Personal narrative |
| Case studies | Results breakdown |

#### Twitter/X

| Strategy | Implementation |
|----------|----------------|
| Thread format | Numbered insights |
| Quote tweets | Add commentary |
| Visual tweets | GIF/video priority |
| Engagement bait | Questions, polls |

### 5. Share Mechanics

#### Technical Share Implementation

```javascript
// Native Web Share API
async function shareContent(data) {
  const shareData = {
    title: 'Experience Our Interactive Product Demo',
    text: 'Check out this incredible 3D web experience!',
    url: window.location.href + '?ref=share'
  };
  
  if (navigator.share && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      trackEvent('share', 'native');
    } catch (err) {
      if (err.name !== 'AbortError') {
        fallbackShare();
      }
    }
  } else {
    fallbackShare();
  }
}

// Fallback for desktop
function fallbackShare() {
  // Copy to clipboard
  navigator.clipboard.writeText(window.location.href);
  showNotification('Link copied to clipboard!');
  trackEvent('share', 'clipboard');
}
```

#### Share Button Placement

```
OPTIMAL SHARE BUTTON PLACEMENT
┌─────────────────────────────────┐
│  FLOATING          [Share]     │  ← Sticky during scroll
├─────────────────────────────────┤
│                                 │
│      Experience Content         │
│                                 │
├─────────────────────────────────┤
│   Peak Moment                   │
│   [Share this moment]           │  ← After wow moment
├─────────────────────────────────┤
│                                 │
│   End of Experience             │
│   [Share] [CTA]                 │  ← Completion point
└─────────────────────────────────┘
```

### 6. Shareable Moment Design

#### Creating Share-Worthy Moments

| Moment Type | Design Approach | Share Trigger |
|-------------|-----------------|---------------|
| Visual Peak | Maximum visual impact | "This is amazing" |
| Achievement | Completion celebration | Pride sharing |
| Personalization | Custom result | Identity sharing |
| Easter Egg | Hidden discovery | Insider sharing |
| Data Reveal | Surprising statistic | Informative sharing |

#### Screenshot Optimization

| Element | Consideration |
|---------|---------------|
| Visual quality | High-res, brand colors |
| Branding | Logo visible but subtle |
| Text overlay | Shareable quote |
| Social handles | Visible but not intrusive |
| URL | Simple, memorable |

### 7. Influencer & Earned Media Strategy

#### Outreach Framework

| Target | Approach | Offer |
|--------|----------|-------|
| Industry influencers | Personal outreach | Early access |
| Tech journalists | Press kit | Story angle |
| Design accounts | Visual assets | Credit/feature |
| Award submissions | Formal entry | Case study |

#### Press Kit Components

| Asset | Purpose |
|-------|---------|
| High-res screenshots | Media use |
| Video clips (various lengths) | Social embedding |
| Fact sheet | Quick reference |
| Quote bank | Ready-to-use quotes |
| Technical overview | Developer audience |
| Contact information | Follow-up |

### 8. Measuring Viral Success

#### Viral Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Share Rate** | Shares / Unique visitors | >1% |
| **Viral Coefficient (K)** | New users / Existing users | >1.0 = viral |
| **Earned Reach** | Impressions from shares | >50% of total |
| **Media Mentions** | Unsolicited coverage | Tracking |
| **Save Rate** | Saves / Views | >3% |

#### Viral Coefficient Calculation

```
K = (Invites per user) × (Conversion rate)

Example:
- Average shares per visitor: 0.3
- Conversion rate of shared links: 20%
- K = 0.3 × 0.2 = 0.06

Goal: K > 1.0 for true virality
```

---

## ✅ SHAREABILITY CHECKLIST

### Content
- [ ] Strong hook in first 3 seconds
- [ ] Clear emotional peak
- [ ] Concise format (under 60 seconds)
- [ ] Visual quality high
- [ ] Branding subtle but present

### Technical
- [ ] Native share API implemented
- [ ] Fallback share options
- [ ] Share tracking configured
- [ ] UTM parameters for shares
- [ ] OG tags optimized

### Distribution
- [ ] Share buttons visible
- [ ] Optimal placement (post-peak)
- [ ] Platform-specific assets ready
- [ ] Influencer outreach planned
- [ ] Press kit prepared

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| D4-01 | Social media playbook |
| D4-02 | Mobile optimization |
| C4-01 | Marketing integration |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| STEPPS framework | ✅ VERIFIED | "Contagious" (Jonah Berger) |
| Viral metrics | ✅ VERIFIED | Growth hacking standards |
| Share API | ✅ VERIFIED | Web API documentation |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Dinda Pratiwi (Social Media & Mobile Specialist)
