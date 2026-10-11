import type { ContentType, ThreatLevel } from '@/lib/supabase';

interface AnalysisResult {
  risk_score: number;
  threat_level: ThreatLevel;
  analysis: string;
}

const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.country'];
const PHISHING_KEYWORDS = [
  'verify your account', 'confirm your password', 'urgent action', 'click here to claim',
  'you have won', 'free gift', 'suspended account', 'update payment', 'reset your password',
  'limited time offer', 'act now', 'wire transfer', 'bitcoin payment', 'gift card',
  'lottery winner', 'inheritance', 'bank details', 'social security', 'tax refund',
];
const SUSPICIOUS_DOMAIN_PATTERNS = [
  'login', 'signin', 'verify', 'account', 'secure', 'update', 'confirm', 'wallet',
  'bank', 'paypal', 'amazon', 'google', 'microsoft', 'apple', 'netflix',
];

function isShortenedUrl(url: string): boolean {
  const shortened = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly'];
  return shortened.some((s) => url.toLowerCase().includes(s));
}

function hasIpAddress(url: string): boolean {
  const ipPattern = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  return ipPattern.test(url);
}

function hasManySubdomains(url: string): boolean {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `http://${url}`).hostname;
    const parts = hostname.split('.');
    return parts.length > 4;
  } catch {
    return false;
  }
}

export function analyzeThreat(
  contentValue: string,
  contentType: ContentType,
  description: string
): AnalysisResult {
  let score = 0;
  const reasons: string[] = [];
  const text = `${contentValue} ${description}`.toLowerCase();

  if (contentType === 'link') {
    const lowerUrl = contentValue.toLowerCase();

    if (SUSPICIOUS_TLDS.some((tld) => lowerUrl.includes(tld))) {
      score += 25;
      reasons.push('Uses a suspicious top-level domain frequently associated with malicious activity.');
    }

    if (isShortenedUrl(lowerUrl)) {
      score += 15;
      reasons.push('URL is shortened, which can hide the real destination.');
    }

    if (hasIpAddress(contentValue)) {
      score += 20;
      reasons.push('URL points directly to an IP address instead of a domain name — a common phishing tactic.');
    }

    if (hasManySubdomains(contentValue)) {
      score += 15;
      reasons.push('URL contains an unusually high number of subdomains, which can impersonate legitimate domains.');
    }

    if (!contentValue.startsWith('https://')) {
      score += 10;
      reasons.push('URL does not use HTTPS encryption, making it insecure for data transmission.');
    }

    SUSPICIOUS_DOMAIN_PATTERNS.forEach((pattern) => {
      if (lowerUrl.includes(pattern)) {
        score += 10;
        reasons.push(`URL contains a brand-impersonation keyword ("${pattern}") often used in phishing.`);
      }
    });

    if (contentValue.includes('@')) {
      score += 15;
      reasons.push('URL contains an @ symbol, which can redirect users to an unexpected destination.');
    }
  }

  PHISHING_KEYWORDS.forEach((keyword) => {
    if (text.includes(keyword)) {
      score += 12;
      reasons.push(`Detected phishing keyword: "${keyword}".`);
    }
  });

  if (contentType === 'message' || contentType === 'email') {
    const urgencyWords = ['urgent', 'immediately', 'expire', 'deadline', 'final notice', 'last chance'];
    urgencyWords.forEach((word) => {
      if (text.includes(word)) {
        score += 8;
        reasons.push(`Uses urgency language ("${word}") to pressure the recipient into acting quickly.`);
      }
    });
  }

  if (contentType === 'poster') {
    if (text.includes('scan') || text.includes('qr code')) {
      score += 15;
      reasons.push('Encourages scanning a QR code, which can redirect to malicious destinations.');
    }
  }

  if (description.length > 0) {
    score += 5;
  }

  score = Math.min(score, 100);

  let threatLevel: ThreatLevel = 'safe';
  if (score >= 60) threatLevel = 'malicious';
  else if (score >= 25) threatLevel = 'suspicious';

  if (reasons.length === 0) {
    reasons.push('No significant risk indicators detected. Content appears safe based on automated analysis.');
  }

  const analysis = `AI KAVASH Analysis (Risk Score: ${score}/100)\n\n${reasons.map((r) => `• ${r}`).join('\n')}`;

  return { risk_score: score, threat_level: threatLevel, analysis };
}
