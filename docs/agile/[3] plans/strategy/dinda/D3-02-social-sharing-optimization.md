# D3-02: Social Sharing Optimization Spec
## Maximizing Shareability for WebGL Experiences

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | D3-02 |
| **Sprint** | 3 - Implementation Planning |
| **Persona** | Dinda Ayu L. (Social Media & Mobile Strategist) |
| **Priority** | 🟡 MEDIUM |
| **Status** | ✅ COMPLETED |
| **Created** | 2025-12-11 |
| **References** | D2-01, D2-03, D3-01 |

---

## 📋 Executive Summary

This specification defines social sharing optimization standards for WebGL experiential sites. Based on Sprint 2 analysis and Hootsuite 2025 benchmarks (LinkedIn 4.0% engagement, Instagram 5.2% carousel), this document provides implementation guidelines for maximizing social reach and engagement.

---

## 🏷️ Open Graph & Meta Tags

### Required Meta Tags

```html
<!-- ILLUSTRATIVE EXAMPLE - Complete Social Meta Tags -->

<head>
  <!-- Primary Meta Tags -->
  <title>Corn Revolution - Premium Corn Experience</title>
  <meta name="title" content="Corn Revolution - Premium Corn Experience">
  <meta name="description" content="Discover the future of sustainable corn farming through our immersive 3D experience. Premium quality, revolutionary approach.">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://cornrevolution.resn.global/">
  <meta property="og:title" content="Corn Revolution - Premium Corn Experience">
  <meta property="og:description" content="Discover the future of sustainable corn farming through our immersive 3D experience.">
  <meta property="og:image" content="https://cornrevolution.resn.global/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="3D rendered corn cob in premium golden lighting">
  <meta property="og:site_name" content="Corn Revolution">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://cornrevolution.resn.global/">
  <meta property="twitter:title" content="Corn Revolution - Premium Corn Experience">
  <meta property="twitter:description" content="Discover the future of sustainable corn farming through our immersive 3D experience.">
  <meta property="twitter:image" content="https://cornrevolution.resn.global/twitter-image.jpg">
  <meta property="twitter:site" content="@cornrevolution">
  <meta property="twitter:creator" content="@cornrevolution">
  
  <!-- LinkedIn Specific -->
  <meta property="og:image:secure_url" content="https://cornrevolution.resn.global/og-image.jpg">
  
  <!-- Additional for Rich Snippets -->
  <link rel="canonical" href="https://cornrevolution.resn.global/">
</head>
```

### Image Specifications

| Platform | Dimensions | Aspect Ratio | Max Size | Format |
|----------|------------|--------------|----------|--------|
| Facebook/LinkedIn | 1200×630px | 1.91:1 | 8MB | JPG, PNG |
| Twitter Large | 1200×628px | 1.91:1 | 5MB | JPG, PNG, GIF |
| Twitter Summary | 144×144px | 1:1 | 5MB | JPG, PNG, GIF |
| Pinterest | 1000×1500px | 2:3 | 10MB | JPG, PNG |
| WhatsApp | 400×400px | 1:1 | 5MB | JPG, PNG |

### Dynamic OG Tags for Sections

```javascript
// ILLUSTRATIVE EXAMPLE - Dynamic Meta Tag Updates

class SocialMetaManager {
  constructor() {
    this.sections = {
      'intro': {
        title: 'Corn Revolution - Our Story',
        description: 'The journey from farm to table, reimagined.',
        image: '/og-images/story.jpg'
      },
      'product': {
        title: 'Corn Revolution - Premium Products',
        description: 'Explore our range of sustainable corn products.',
        image: '/og-images/products.jpg'
      },
      'sustainability': {
        title: 'Corn Revolution - Sustainability',
        description: 'Our commitment to the environment.',
        image: '/og-images/sustainability.jpg'
      }
    };
  }
  
  updateMetaForSection(sectionId) {
    const section = this.sections[sectionId];
    if (!section) return;
    
    // Update meta tags
    document.querySelector('meta[property="og:title"]')
      .setAttribute('content', section.title);
    document.querySelector('meta[property="og:description"]')
      .setAttribute('content', section.description);
    document.querySelector('meta[property="og:image"]')
      .setAttribute('content', section.image);
    
    // Update canonical URL with hash
    document.querySelector('link[rel="canonical"]')
      .setAttribute('href', `https://cornrevolution.resn.global/#${sectionId}`);
  }
}
```

---

## 📸 Screenshot/Preview Generation

### WebGL Screenshot System

```javascript
// ILLUSTRATIVE EXAMPLE - WebGL Screenshot for Sharing

class ShareScreenshotGenerator {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
  }
  
  async captureScreenshot(options = {}) {
    const {
      width = 1200,
      height = 630,
      format = 'image/jpeg',
      quality = 0.9,
      includeUI = false
    } = options;
    
    // Store original size
    const originalSize = this.renderer.getSize(new THREE.Vector2());
    
    // Resize for social dimensions
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Render frame
    this.renderer.render(this.scene, this.camera);
    
    // Capture
    let canvas = this.renderer.domElement;
    
    if (includeUI) {
      canvas = await this.compositeWithUI(canvas);
    }
    
    // Convert to blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, format, quality);
    });
    
    // Restore original size
    this.renderer.setSize(originalSize.x, originalSize.y);
    this.camera.aspect = originalSize.x / originalSize.y;
    this.camera.updateProjectionMatrix();
    
    return blob;
  }
  
  async compositeWithUI(webglCanvas) {
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = webglCanvas.width;
    compositeCanvas.height = webglCanvas.height;
    const ctx = compositeCanvas.getContext('2d');
    
    // Draw WebGL content
    ctx.drawImage(webglCanvas, 0, 0);
    
    // Add branding overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, compositeCanvas.height - 80, compositeCanvas.width, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Corn Revolution', 30, compositeCanvas.height - 30);
    
    return compositeCanvas;
  }
  
  async shareScreenshot(platform) {
    const blob = await this.captureScreenshot();
    const file = new File([blob], 'corn-revolution-share.jpg', { type: 'image/jpeg' });
    
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Corn Revolution Experience',
        text: 'Check out this amazing 3D corn experience!',
        files: [file]
      });
    } else {
      // Fallback: open share dialog
      this.openShareDialog(platform, blob);
    }
  }
}
```

### Pre-Generated Share Images

```
/share-images/
├── og-default.jpg           # 1200×630 - Default share image
├── og-story.jpg             # 1200×630 - Story section
├── og-product.jpg           # 1200×630 - Product section
├── og-sustainability.jpg    # 1200×630 - Sustainability section
├── twitter-card.jpg         # 1200×628 - Twitter optimized
├── pinterest-pin.jpg        # 1000×1500 - Pinterest vertical
├── instagram-square.jpg     # 1080×1080 - Instagram square
└── whatsapp-preview.jpg     # 400×400 - WhatsApp thumbnail
```

---

## 🔗 Share Button Implementation

### Native Web Share API

```javascript
// ILLUSTRATIVE EXAMPLE - Share Functionality

class ShareManager {
  constructor() {
    this.nativeShareSupported = navigator.share !== undefined;
  }
  
  async share(options = {}) {
    const {
      title = 'Corn Revolution',
      text = 'Check out this immersive corn experience!',
      url = window.location.href
    } = options;
    
    if (this.nativeShareSupported) {
      try {
        await navigator.share({ title, text, url });
        this.trackShare('native');
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
    
    // Fallback to share modal
    this.showShareModal({ title, text, url });
    return false;
  }
  
  showShareModal(options) {
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
      <div class="share-modal-content">
        <h3>Share this experience</h3>
        <div class="share-buttons">
          <button data-platform="facebook" aria-label="Share on Facebook">
            <svg><!-- Facebook icon --></svg>
            Facebook
          </button>
          <button data-platform="twitter" aria-label="Share on Twitter">
            <svg><!-- Twitter icon --></svg>
            Twitter
          </button>
          <button data-platform="linkedin" aria-label="Share on LinkedIn">
            <svg><!-- LinkedIn icon --></svg>
            LinkedIn
          </button>
          <button data-platform="copy" aria-label="Copy link">
            <svg><!-- Copy icon --></svg>
            Copy Link
          </button>
        </div>
        <button class="close-modal" aria-label="Close">×</button>
      </div>
    `;
    
    modal.querySelectorAll('[data-platform]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.shareToPlatform(btn.dataset.platform, options);
      });
    });
    
    document.body.appendChild(modal);
  }
  
  shareToPlatform(platform, options) {
    const { title, text, url } = options;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const encodedTitle = encodeURIComponent(title);
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`
    };
    
    if (platform === 'copy') {
      this.copyToClipboard(url);
      return;
    }
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      this.trackShare(platform);
    }
  }
  
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopiedFeedback();
      this.trackShare('copy');
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showCopiedFeedback();
    }
  }
  
  trackShare(platform) {
    dataLayer.push({
      event: 'social_share',
      share_platform: platform,
      share_url: window.location.href
    });
  }
}
```

### Share Button Placement

| Position | Visibility | Context |
|----------|------------|---------|
| Floating (corner) | Always visible | General sharing |
| End of sections | On scroll reveal | Section-specific sharing |
| Post-interaction | After key interaction | Engagement reward |
| Thank you page | After form submit | Lead celebration |

---

## 📊 UTM Parameter Strategy

### UTM Structure

```
https://cornrevolution.resn.global/?
  utm_source=[platform]&
  utm_medium=[type]&
  utm_campaign=[campaign]&
  utm_content=[variant]&
  utm_term=[keyword]
```

### Platform-Specific UTMs

| Platform | Source | Medium | Example |
|----------|--------|--------|---------|
| Facebook Organic | facebook | social | utm_source=facebook&utm_medium=social |
| Facebook Ads | facebook | paid_social | utm_source=facebook&utm_medium=paid_social |
| LinkedIn Organic | linkedin | social | utm_source=linkedin&utm_medium=social |
| Twitter | twitter | social | utm_source=twitter&utm_medium=social |
| Instagram | instagram | social | utm_source=instagram&utm_medium=social |
| Email | email | email | utm_source=email&utm_medium=email |
| Direct Share | share | referral | utm_source=share&utm_medium=referral |

### Auto UTM Generator

```javascript
// ILLUSTRATIVE EXAMPLE - UTM Generator for Share Links

function generateShareUrl(platform, campaign = 'organic') {
  const baseUrl = 'https://cornrevolution.resn.global/';
  const currentSection = getCurrentSection();
  
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: 'social',
    utm_campaign: campaign,
    utm_content: currentSection
  });
  
  return `${baseUrl}?${params.toString()}`;
}

// Usage
const facebookShareUrl = generateShareUrl('facebook', 'launch_2025');
// https://cornrevolution.resn.global/?utm_source=facebook&utm_medium=social&utm_campaign=launch_2025&utm_content=hero
```

---

## 📱 Platform-Specific Optimizations

### LinkedIn (B2B Primary)

| Element | Optimization |
|---------|--------------|
| Image | Professional, clean, product-focused |
| Title | Clear value proposition (70 chars max) |
| Description | Industry-relevant, data-driven (150 chars) |
| CTA | "Learn more" or "See the demo" |

**Best Time to Post**: Tuesday-Thursday, 8-10am or 12pm

### Instagram (Visual Focus)

| Element | Optimization |
|---------|--------------|
| Image | Vibrant, high-contrast, mobile-optimized |
| Caption | Storytelling, emojis allowed, hashtags |
| Stories | Behind-the-scenes, swipe-up link (if available) |
| Reels | Process video, transformation |

**Best Time to Post**: Monday-Friday, 11am-1pm or 7-9pm

### Twitter/X (Real-time)

| Element | Optimization |
|---------|--------------|
| Image | Eye-catching, text overlay optional |
| Copy | Concise, conversational, question format |
| Hashtags | 1-2 relevant (not more) |
| Thread | For longer narratives |

**Best Time to Post**: Weekdays, 9am-12pm

---

## 📈 Virality Mechanisms

### Shareable Moments

| Moment | Trigger | Share Prompt |
|--------|---------|--------------|
| First scene completion | Animation end | "Share your journey so far" |
| Product reveal | 3D interaction | "Share this amazing view" |
| Achievement unlock | Hidden content | "You discovered something special!" |
| Form completion | Thank you page | "Tell others about us" |

### Social Proof Integration

```javascript
// ILLUSTRATIVE EXAMPLE - Social Proof Display

class SocialProofDisplay {
  constructor() {
    this.displayElement = document.querySelector('.social-proof');
  }
  
  async fetchShareCount() {
    // Note: Most platforms no longer support share counts
    // Use internal tracking instead
    const response = await fetch('/api/share-stats');
    return response.json();
  }
  
  displayProof(stats) {
    const { totalShares, recentShares } = stats;
    
    this.displayElement.innerHTML = `
      <div class="share-count">
        <span class="count">${this.formatNumber(totalShares)}</span>
        <span class="label">people shared this</span>
      </div>
      ${recentShares.length > 0 ? `
        <div class="recent-shares">
          ${recentShares.map(share => `
            <img src="${share.avatar}" alt="${share.name}" 
                 title="${share.name} shared this">
          `).join('')}
        </div>
      ` : ''}
    `;
  }
  
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }
}
```

---

## ✅ Implementation Checklist

### Pre-Launch

- [ ] All meta tags implemented
- [ ] Share images created for all platforms
- [ ] Share buttons functional
- [ ] UTM parameters configured
- [ ] Social previews tested (Facebook Debugger, Twitter Validator)
- [ ] Analytics tracking for shares

### Post-Launch

- [ ] Monitor share metrics daily
- [ ] A/B test share copy/images
- [ ] Respond to social mentions
- [ ] Update OG images seasonally
- [ ] Track top-performing content

---

## 🔗 Cross-References

| Document | Relationship |
|----------|--------------|
| D2-01 (Shareability Analysis) | Analysis foundation |
| D2-03 (Viral Potential) | Virality insights |
| D3-01 (Social Integration) | Strategy overview |
| C3-02 (Analytics) | Tracking implementation |

---

## 📊 Data Classification

| Category | Classification |
|----------|----------------|
| **Primary Data** | Hootsuite 2025 benchmarks |
| **Standards** | Open Graph Protocol, Twitter Cards |
| **Code Examples** | Illustrative (not from live site) |
| **Best Practices** | Platform-specific guidelines |

---

*Document Status: ✅ COMPLETED*
*Last Updated: 2025-12-11*
