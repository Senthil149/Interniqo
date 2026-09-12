package com.internship.platform.service;

import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;

/**
 * Service evaluating domain-level heuristics for company verification:
 * - Distinguishes common free/personal email providers (e.g., gmail, yahoo, outlook) from organizational domains.
 * - Extracts and compares company website domains against verified email domains.
 *
 * Complies with Design Rule #4:
 * Informational domain heuristics are signals, never proof of company illegitimacy or legal incorporation.
 */
@Service
public class DomainQualityService {

    /**
     * Curated list of common free / personal email provider domains.
     */
    private static final Set<String> PERSONAL_EMAIL_DOMAINS = Set.of(
            "gmail.com",
            "googlemail.com",
            "yahoo.com",
            "ymail.com",
            "rocketmail.com",
            "outlook.com",
            "hotmail.com",
            "live.com",
            "msn.com",
            "icloud.com",
            "me.com",
            "mac.com",
            "aol.com",
            "aim.com",
            "protonmail.com",
            "proton.me",
            "zoho.com",
            "zohomail.com",
            "mail.com",
            "email.com",
            "gmx.com",
            "gmx.net",
            "fastmail.com",
            "fastmail.fm",
            "tutanota.com",
            "tuta.com",
            "tuta.io",
            "yandex.com",
            "yandex.ru",
            "qq.com",
            "163.com",
            "126.com",
            "rediffmail.com",
            "inbox.com",
            "hushmail.com"
    );

    /**
     * Extracts the normalized domain portion from an email address (e.g. "hr@uber.com" -> "uber.com").
     */
    public String extractDomainFromEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        int atIndex = email.lastIndexOf('@');
        if (atIndex < 0 || atIndex >= email.length() - 1) {
            return null;
        }
        return email.substring(atIndex + 1).trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Checks if the given email belongs to a known free or personal email provider.
     */
    public boolean isPersonalEmail(String email) {
        String domain = extractDomainFromEmail(email);
        if (domain == null) {
            return false;
        }

        if (PERSONAL_EMAIL_DOMAINS.contains(domain)) {
            return true;
        }

        // Check for subdomains of personal email providers (e.g., mail.gmail.com)
        for (String provider : PERSONAL_EMAIL_DOMAINS) {
            if (domain.endsWith("." + provider)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extracts the normalized host/domain from a website URL.
     * Examples:
     *   "https://www.uber.com/about" -> "uber.com"
     *   "http://jobs.stripe.com:8080/" -> "jobs.stripe.com"
     *   "acme-tech.org" -> "acme-tech.org"
     */
    public String extractDomainFromUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }

        String cleaned = url.trim().toLowerCase(Locale.ROOT);

        // Strip scheme
        if (cleaned.startsWith("https://")) {
            cleaned = cleaned.substring(8);
        } else if (cleaned.startsWith("http://")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("//")) {
            cleaned = cleaned.substring(2);
        }

        // Strip path, query, and fragments
        int slashIdx = cleaned.indexOf('/');
        if (slashIdx >= 0) {
            cleaned = cleaned.substring(0, slashIdx);
        }
        int queryIdx = cleaned.indexOf('?');
        if (queryIdx >= 0) {
            cleaned = cleaned.substring(0, queryIdx);
        }
        int hashIdx = cleaned.indexOf('#');
        if (hashIdx >= 0) {
            cleaned = cleaned.substring(0, hashIdx);
        }

        // Strip port
        int portIdx = cleaned.indexOf(':');
        if (portIdx >= 0) {
            cleaned = cleaned.substring(0, portIdx);
        }

        // Strip leading www.
        if (cleaned.startsWith("www.")) {
            cleaned = cleaned.substring(4);
        }

        cleaned = cleaned.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    /**
     * Evaluates whether the verified company email domain matches the stated website domain.
     *
     * Rules:
     * 1. Returns false if email is null, website is null/blank, or domain extraction fails.
     * 2. Returns false if the email is from a personal email provider (prevents e.g. "gmail.com" from matching).
     * 3. Returns true if domains match exactly (e.g., "uber.com" == "uber.com").
     * 4. Returns true if one is a subdomain of the other (e.g. "mail.uber.com" and "uber.com", or "uber.com" and "careers.uber.com").
     */
    public boolean matchesWebsiteDomain(String email, String website) {
        if (email == null || website == null || website.isBlank()) {
            return false;
        }

        if (isPersonalEmail(email)) {
            return false;
        }

        String emailDomain = extractDomainFromEmail(email);
        String websiteDomain = extractDomainFromUrl(website);

        if (emailDomain == null || websiteDomain == null) {
            return false;
        }

        if (emailDomain.equals(websiteDomain)) {
            return true;
        }

        // Subdomain checks
        if (emailDomain.endsWith("." + websiteDomain) || websiteDomain.endsWith("." + emailDomain)) {
            return true;
        }

        return false;
    }
}
