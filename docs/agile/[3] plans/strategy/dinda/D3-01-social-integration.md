# D3-01: Social Media Integration Strategy

## 📋 METADATA
- **Persona**: Dinda Kusuma - Social Media Specialist
- **Task ID**: D3-01
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🔴 HIGH

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Social Benchmarks | ✅ **VERIFIED** | Hootsuite 2025 |
| Platform Specs | ✅ **VERIFIED** | Official Platform Docs |
> | Engagement Rates | ✅ **VERIFIED** | Sprout Social 2024 |
> | Strategy | ⚠️ **RECOMMENDATION** | Based on verified data |

---

## 🎯 OBJECTIVE

Design and implement social media sharing integration for WebGL experiential landing page, maximizing viral potential through optimized meta tags, share mechanics, and platform-specific content strategies.

---

## 📊 SOCIAL PLATFORM BENCHMARKS

### Engagement Rates by Platform (Sprout Social 2024)

| Platform | Avg Engagement Rate | B2B Engagement | Best Content Type |
|----------|---------------------|----------------|-------------------|
| LinkedIn | 2.0% | 2.7% ✅ | Thought leadership |
| Instagram | 1.2% | 0.8% | Visual stories |
| Twitter/X | 0.05% | 0.08% | News, insights |
| Facebook | 0.06% | 0.05% | Community content |
| TikTok | 5.7% | 1.2% | Short-form video |

### Optimal Posting Times (Hootsuite 2025)

| Platform | Best Days | Best Times (Local) |
|----------|-----------|-------------------|
| LinkedIn | Tue-Thu | 7-8 AM, 12 PM |
| Instagram | Mon, Wed | 11 AM, 7-8 PM |
| Twitter/X | Wed, Fri | 9 AM, 12 PM |
| Facebook | Wed, Thu | 1-4 PM |

---

## 🔗 OPEN GRAPH IMPLEMENTATION

### Meta Tag Specifications

```html
<!-- Primary Meta Tags -->
<title>Corn Revolution | Interactive Experience</title>
<meta name="title" content="Corn Revolution | Interactive Experience">
<meta name="description" content="Explore the future of agriculture through an immersive 3D journey. Discover innovation in action.">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://cornrevolution.resn.global/">
<meta property="og:title" content="Corn Revolution | Interactive Experience">
<meta property="og:description" content="Explore the future of agriculture through an immersive 3D journey.">
<meta property="og:image" content="https://cornrevolution.resn.global/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Corn Revolution - 3D Experience Preview">
<meta property="og:site_name" content="Corn Revolution">
<meta property="og:locale" content="en_US">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@cornrevolution">
<meta name="twitter:creator" content="@cornrevolution">
<meta name="twitter:url" content="https://cornrevolution.resn.global/">
<meta name="twitter:title" content="Corn Revolution | Interactive Experience">
<meta name="twitter:description" content="Explore the future of agriculture through an immersive 3D journey.">
<meta name="twitter:image" content="https://cornrevolution.resn.global/twitter-image.jpg">
<meta name="twitter:image:alt" content="Corn Revolution - 3D Experience Preview">

<!-- LinkedIn -->
<meta property="og:image" content="https://cornrevolution.resn.global/linkedin-image.jpg">
<!-- LinkedIn prefers 1200x628 -->

<!-- WhatsApp (uses OG tags) -->
<!-- Image should be < 300KB for optimal loading -->

<!-- Pinterest -->
<meta name="pinterest-rich-pin" content="true">
<meta property="og:image" content="https://cornrevolution.resn.global/pinterest-image.jpg">
<!-- Pinterest prefers 2:3 ratio (1000x1500) -->
```

### Image Specifications by Platform

| Platform | Recommended Size | Aspect Ratio | Max File Size |
|----------|------------------|--------------|---------------|
| Facebook | 1200 × 630 | 1.91:1 | 8 MB |
| Twitter | 1200 × 628 | 1.91:1 | 5 MB |
| LinkedIn | 1200 × 628 | 1.91:1 | 5 MB |
| WhatsApp | 1200 × 630 | 1.91:1 | 300 KB |
| Pinterest | 1000 × 1500 | 2:3 | 20 MB |
| iMessage | 1200 × 630 | 1.91:1 | 5 MB |

---

## 🔘 SHARE BUTTON IMPLEMENTATION

### Native Share API (Modern Browsers)

```javascript
// Share button component
class ShareButton {
  constructor(options) {
    this.url = options.url || window.location.href;
    this.title = options.title || document.title;
    this.text = options.text || '';
    this.platforms = options.platforms || ['native', 'twitter', 'linkedin', 'facebook'];
  }
  
  async share(platform = 'native') {
    // Track share intent
    this.trackShare('share_intent', platform);
    
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: this.title,
          text: this.text,
          url: this.url
        });
        this.trackShare('share_success', 'native');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      this.openShareWindow(platform);
    }
  }
  
  openShareWindow(platform) {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(this.url)}&text=${encodeURIComponent(this.text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(this.text + ' ' + this.url)}`,
      email: `mailto:?subject=${encodeURIComponent(this.title)}&body=${encodeURIComponent(this.text + '\n\n' + this.url)}`
    };
    
    const shareUrl = urls[platform];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      this.trackShare('share_click', platform);
    }
  }
  
  trackShare(action, platform) {
    if (window.gtag) {
      gtag('event', action, {
        event_category: 'social',
        event_label: platform
      });
    }
  }
}

// Usage
const shareButton = new ShareButton({
  url: 'https://cornrevolution.resn.global/',
  title: 'Corn Revolution | Interactive Experience',
  text: 'Check out this amazing 3D agricultural experience! 🌽'
});

// Native share (mobile)
document.querySelector('.share-native').addEventListener('click', () => {
  shareButton.share('native');
});

// Platform-specific
document.querySelector('.share-twitter').addEventListener('click', () => {
  shareButton.share('twitter');
});
```

### Share Button UI

```html
<!-- Share Button Group -->
<div class="share-group" role="group" aria-label="Share this page">
  <!-- Native Share (Mobile) -->
  <button class="share-btn share-native" aria-label="Share">
    <svg aria-hidden="true"><!-- Share icon --></svg>
    <span>Share</span>
  </button>
  
  <!-- Platform Buttons (Desktop) -->
  <div class="share-platforms">
    <button class="share-btn share-twitter" aria-label="Share on Twitter">
      <svg aria-hidden="true"><!-- Twitter icon --></svg>
      <span class="sr-only">Twitter</span>
    </button>
    
    <button class="share-btn share-linkedin" aria-label="Share on LinkedIn">
      <svg aria-hidden="true"><!-- LinkedIn icon --></svg>
      <span class="sr-only">LinkedIn</span>
    </button>
    
    <button class="share-btn share-facebook" aria-label="Share on Facebook">
      <svg aria-hidden="true"><!-- Facebook icon --></svg>
      <span class="sr-only">Facebook</span>
    </button>
    
    <button class="share-btn share-whatsapp" aria-label="Share on WhatsApp">
      <svg aria-hidden="true"><!-- WhatsApp icon --></svg>
      <span class="sr-only">WhatsApp</span>
    </button>
    
    <button class="share-btn share-email" aria-label="Share via email">
      <svg aria-hidden="true"><!-- Email icon --></svg>
      <span class="sr-only">Email</span>
    </button>
  </div>
</div>
```

```css
/* Share Button Styling */
.share-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  cursor: pointer;
  transition: all 200ms ease;
  min-width: 44px;
  min-height: 44px;
}

.share-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.share-btn:focus-visible {
  outline: 3px solid #F7C948;
  outline-offset: 2px;
}

.share-btn svg {
  width: 20px;
  height: 20px;
}

/* Platform Colors */
.share-twitter:hover { background: #1DA1F2; }
.share-linkedin:hover { background: #0077B5; }
.share-facebook:hover { background: #4267B2; }
.share-whatsapp:hover { background: #25D366; }

/* Mobile: Show native share only */
@media (max-width: 768px) {
  .share-platforms { display: none; }
  .share-native { display: flex; }
}

/* Desktop: Show platform buttons */
@media (min-width: 769px) {
  .share-native { display: none; }
  .share-platforms { display: flex; gap: 8px; }
}
```

---

## 📸 SHAREABLE MOMENT CAPTURE

### Screenshot/Canvas Capture

```javascript
// Capture WebGL canvas for sharing
class CanvasCapture {
  constructor(renderer) {
    this.renderer = renderer;
  }
  
  capture(filename = 'corn-revolution.png') {
    // Preserve drawing buffer for capture
    const canvas = this.renderer.domElement;
    
    // Render current frame
    this.renderer.render(scene, camera);
    
    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // Track capture
    this.trackCapture('screenshot');
  }
  
  async captureAndShare() {
    const canvas = this.renderer.domElement;
    this.renderer.render(scene, camera);
    
    try {
      // Convert to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      // Create file for sharing
      const file = new File([blob], 'corn-revolution.png', { type: 'image/png' });
      
      // Use Web Share API with image
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Corn Revolution Moment',
          text: 'Check out my journey through Corn Revolution! 🌽'
        });
        this.trackCapture('share_with_image');
      }
    } catch (err) {
      console.error('Capture failed:', err);
    }
  }
  
  trackCapture(type) {
    if (window.gtag) {
      gtag('event', 'content_capture', {
        event_category: 'social',
        event_label: type
      });
    }
  }
}

// Usage
const capture = new CanvasCapture(renderer);

document.querySelector('.capture-btn').addEventListener('click', () => {
  capture.capture();
});

document.querySelector('.capture-share-btn').addEventListener('click', () => {
  capture.captureAndShare();
});
```

### Shareable Moment Triggers

| Moment | Trigger | Prompt |
|--------|---------|--------|
| Hero Reveal | 20% scroll | "Share this moment?" |
| Climax | 75% scroll | "Capture this view!" |
| Completion | 100% scroll | "Share your journey!" |
| Easter Egg | Special interaction | "You found it! Share?" |

---

## 📊 SOCIAL TRACKING IMPLEMENTATION

### UTM Parameter Structure

```javascript
// UTM tracking for social shares
const utmBuilder = {
  base: 'https://cornrevolution.resn.global/',
  
  build(source, medium = 'social', campaign = 'share') {
    const params = new URLSearchParams({
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign,
      utm_content: `share_${Date.now()}`
    });
    
    return `${this.base}?${params.toString()}`;
  },
  
  getShareUrls() {
    return {
      twitter: this.build('twitter'),
      linkedin: this.build('linkedin'),
      facebook: this.build('facebook'),
      whatsapp: this.build('whatsapp'),
      email: this.build('email', 'email')
    };
  }
};
```

### Social Analytics Events

| Event | Trigger | Properties |
|-------|---------|------------|
| share_button_view | Button visible | position, platform |
| share_intent | Button click | platform |
| share_complete | Share confirmed | platform, content_type |
| social_referral | UTM source | source, medium, campaign |

```javascript
// Social analytics tracking
class SocialAnalytics {
  trackShareButtonView(position, platform) {
    gtag('event', 'share_button_view', {
      event_category: 'social',
      position: position,
      platform: platform
    });
  }
  
  trackShareIntent(platform) {
    gtag('event', 'share_intent', {
      event_category: 'social',
      event_label: platform
    });
  }
  
  trackShareComplete(platform, contentType = 'page') {
    gtag('event', 'share_complete', {
      event_category: 'social',
      event_label: platform,
      content_type: contentType
    });
  }
  
  trackReferral() {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    
    if (source) {
      gtag('event', 'social_referral', {
        event_category: 'social',
        utm_source: source,
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign')
      });
    }
  }
}
```

---

## 📱 PLATFORM-SPECIFIC CONTENT

### Twitter/X Strategy

```
Content Format:
├── Character limit: 280
├── Include: Link + 2 hashtags
├── Tone: Conversational, curious
└── CTA: Question or invitation

Example Post:
"Ever seen corn like this? 🌽 
Explore the future of agriculture in this mind-blowing 3D experience. 

[link]

#AgTech #Innovation"
```

### LinkedIn Strategy

```
Content Format:
├── Character limit: 3,000
├── Include: Link + industry insight
├── Tone: Professional, thought-leading
└── CTA: Discussion prompt

Example Post:
"The intersection of agriculture and technology is evolving rapidly.

This interactive experience showcases how modern innovations are transforming one of humanity's oldest industries.

Worth 2 minutes of your time: [link]

What agricultural innovations are you most excited about?

#AgTech #Innovation #FutureOfFood"
```

### WhatsApp/Messaging Strategy

```
Content Format:
├── Keep under 100 characters
├── Include: Emoji + link
├── Tone: Personal, excited
└── CTA: Direct invitation

Example Message:
"Check this out! 🌽 Amazing 3D experience: [link]"
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)
- [ ] Implement Open Graph meta tags
- [ ] Create share images (all sizes)
- [ ] Set up share button component

### Phase 2: Integration (Week 2)
- [ ] Add native Web Share API
- [ ] Implement platform share buttons
- [ ] Set up UTM tracking

### Phase 3: Enhancement (Week 3)
- [ ] Add canvas capture feature
- [ ] Implement shareable moments
- [ ] Create moment-specific share prompts

### Phase 4: Optimization (Week 4)
- [ ] Analyze share metrics
- [ ] A/B test share button placement
- [ ] Optimize share copy

---

## 🔗 CROSS-REFERENCES

- **D2-01**: Social shareability analysis (input)
- **D2-03**: Viral potential assessment (input)
- **D3-02**: Content calendar (companion)
- **C3-01**: Conversion tracking (alignment)
- **AM3-01**: Share button accessibility (coordination)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| Hootsuite 2025 | Industry Report | Posting times |
| Sprout Social 2024 | Industry Report | Engagement rates |
| Platform Docs | Official | Image specifications |
| Open Graph Protocol | Standard | Meta tag specs |

---
