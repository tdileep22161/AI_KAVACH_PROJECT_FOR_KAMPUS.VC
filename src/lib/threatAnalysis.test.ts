import { describe, it, expect } from 'vitest';
import { analyzeThreat } from './threatAnalysis';

describe('analyzeThreat', () => {
  describe('safe content', () => {
    it('returns safe for a clean HTTPS URL with no suspicious indicators', () => {
      const result = analyzeThreat('https://google.com/search', 'link', '');
      expect(result.risk_score).toBeLessThan(25);
      expect(result.threat_level).toBe('safe');
    });

    it('returns safe for a simple HTTPS domain', () => {
      const result = analyzeThreat('https://example.com', 'link', '');
      expect(result.threat_level).toBe('safe');
      expect(result.risk_score).toBe(0);
    });

    it('includes analysis text prefixed with AI KAVASH', () => {
      const result = analyzeThreat('https://example.com', 'link', '');
      expect(result.analysis).toContain('AI KAVASH Analysis');
    });
  });

  describe('suspicious content', () => {
    it('flags HTTP (non-HTTPS) URLs with added risk', () => {
      const result = analyzeThreat('http://example.com/login', 'link', '');
      expect(result.risk_score).toBeGreaterThan(0);
    });

    it('flags URL shortener services', () => {
      const result = analyzeThreat('https://bit.ly/abc123', 'link', '');
      expect(result.risk_score).toBeGreaterThanOrEqual(15);
    });

    it('flags URLs with IP addresses', () => {
      const result = analyzeThreat('http://192.168.1.1/login', 'link', '');
      expect(result.risk_score).toBeGreaterThanOrEqual(20);
    });

    it('flags URLs with many subdomains', () => {
      const result = analyzeThreat('https://a.b.c.d.example.com', 'link', '');
      expect(result.risk_score).toBeGreaterThanOrEqual(15);
    });
  });

  describe('malicious content', () => {
    it('flags suspicious TLDs with high risk', () => {
      const result = analyzeThreat('https://paypal-verify-account.tk/login', 'link', '');
      expect(result.risk_score).toBeGreaterThanOrEqual(25);
      expect(result.threat_level).not.toBe('safe');
    });

    it('classifies phishing URLs with multiple indicators as malicious', () => {
      const result = analyzeThreat(
        'http://paypal-verify-account.tk/login?verify your account',
        'link',
        'urgent action required: confirm your password'
      );
      expect(result.risk_score).toBeGreaterThanOrEqual(60);
      expect(result.threat_level).toBe('malicious');
    });

    it('detects phishing keywords in description', () => {
      const result = analyzeThreat('https://example.com', 'link', 'click here to claim your free gift');
      expect(result.risk_score).toBeGreaterThanOrEqual(24);
    });

    it('flags @ symbol in URL', () => {
      const result = analyzeThreat('https://example.com@evil.com', 'link', '');
      expect(result.risk_score).toBeGreaterThanOrEqual(15);
    });
  });

  describe('message and email content', () => {
    it('detects urgency language in messages', () => {
      const result = analyzeThreat('Check this out', 'message', 'urgent: your account will expire immediately');
      expect(result.risk_score).toBeGreaterThanOrEqual(16);
    });

    it('detects urgency language in emails', () => {
      const result = analyzeThreat('Important notice', 'email', 'This is your final notice, act now');
      expect(result.risk_score).toBeGreaterThan(0);
    });

    it('does not apply urgency scoring to link content type', () => {
      const linkResult = analyzeThreat('https://example.com', 'link', 'urgent immediately expire');
      const msgResult = analyzeThreat('https://example.com', 'message', 'urgent immediately expire');
      expect(msgResult.risk_score).toBeGreaterThan(linkResult.risk_score);
    });
  });

  describe('poster content', () => {
    it('flags QR code references in posters', () => {
      const result = analyzeThreat('Event flyer', 'poster', 'scan the qr code to win');
      expect(result.risk_score).toBeGreaterThanOrEqual(15);
    });
  });

  describe('score boundaries', () => {
    it('caps risk score at 100', () => {
      const result = analyzeThreat(
        'http://paypal-verify-account.tk/login/confirm/wallet/bank/secure/update',
        'link',
        'verify your account confirm your password urgent action click here to claim you have won free gift suspended account update payment reset your password limited time offer act now wire transfer bitcoin payment gift card lottery winner inheritance bank details social security tax refund'
      );
      expect(result.risk_score).toBeLessThanOrEqual(100);
    });

    it('classifies scores below 25 as safe', () => {
      const result = analyzeThreat('https://example.com', 'link', '');
      expect(result.threat_level).toBe('safe');
    });

    it('classifies scores 25-59 as suspicious', () => {
      const result = analyzeThreat('https://bit.ly/login', 'link', '');
      expect(result.risk_score).toBeGreaterThanOrEqual(25);
      expect(result.risk_score).toBeLessThan(60);
      expect(result.threat_level).toBe('suspicious');
    });

    it('classifies scores 60+ as malicious', () => {
      const result = analyzeThreat(
        'http://paypal-verify-account.tk/login/confirm',
        'link',
        'verify your account urgent action'
      );
      expect(result.risk_score).toBeGreaterThanOrEqual(60);
      expect(result.threat_level).toBe('malicious');
    });
  });

  describe('analysis output format', () => {
    it('always includes at least one reason', () => {
      const result = analyzeThreat('https://example.com', 'link', '');
      expect(result.analysis).toContain('•');
    });

    it('includes the risk score in the analysis text', () => {
      const result = analyzeThreat('https://bit.ly/test', 'link', '');
      expect(result.analysis).toContain('Risk Score:');
      expect(result.analysis).toContain(String(result.risk_score));
    });

    it('provides a safe message when no risk indicators are found', () => {
      const result = analyzeThreat('https://example.com', 'link', '');
      expect(result.analysis).toContain('No significant risk indicators');
    });
  });

  describe('edge cases', () => {
    it('handles empty content value', () => {
      const result = analyzeThreat('', 'link', '');
      expect(result).toBeDefined();
      expect(result.risk_score).toBeGreaterThanOrEqual(0);
    });

    it('handles non-link content type without URL checks', () => {
      const result = analyzeThreat('some text', 'message', '');
      expect(result.risk_score).toBe(0);
    });

    it('adds risk for having a description', () => {
      const withDesc = analyzeThreat('https://example.com', 'link', 'some description');
      const withoutDesc = analyzeThreat('https://example.com', 'link', '');
      expect(withDesc.risk_score).toBeGreaterThan(withoutDesc.risk_score);
    });
  });
});
