package com.internship.platform.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class DomainQualityServiceTest {

    private DomainQualityService domainQualityService;

    @BeforeEach
    void setUp() {
        domainQualityService = new DomainQualityService();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "hr@gmail.com",
            "founder@googlemail.com",
            "contact@yahoo.com",
            "info@ymail.com",
            "recruiting@outlook.com",
            "team@hotmail.com",
            "support@live.com",
            "ceo@icloud.com",
            "startup@aol.com",
            "security@protonmail.com",
            "hello@proton.me",
            "admin@zoho.com",
            "jobs@mail.com",
            "hr@gmx.com",
            "founder@fastmail.com"
    })
    @DisplayName("isPersonalEmail returns true for common free and personal email providers")
    void isPersonalEmail_returnsTrueForPersonalProviders(String email) {
        assertTrue(domainQualityService.isPersonalEmail(email),
                "Expected " + email + " to be flagged as a personal email provider");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "recruiter@stripe.com",
            "careers@uber.com",
            "engineering@acme-corp.org",
            "jobs@deepmind.google",
            "interns@stanford.edu",
            "team@meta.com",
            "info@novasoft.io"
    })
    @DisplayName("isPersonalEmail returns false for genuine organizational domains")
    void isPersonalEmail_returnsFalseForOrganizationalDomains(String email) {
        assertFalse(domainQualityService.isPersonalEmail(email),
                "Expected " + email + " to NOT be flagged as a personal email provider");
    }

    @Test
    @DisplayName("isPersonalEmail handles null and invalid emails gracefully")
    void isPersonalEmail_handlesInvalidEmails() {
        assertFalse(domainQualityService.isPersonalEmail(null));
        assertFalse(domainQualityService.isPersonalEmail(""));
        assertFalse(domainQualityService.isPersonalEmail("invalid-email"));
    }

    @Test
    @DisplayName("extractDomainFromUrl cleanly parses domains from various URL formats")
    void extractDomainFromUrl_normalizesCorrectly() {
        assertEquals("uber.com", domainQualityService.extractDomainFromUrl("https://uber.com"));
        assertEquals("uber.com", domainQualityService.extractDomainFromUrl("https://www.uber.com/about/careers?ref=nav#hero"));
        assertEquals("stripe.com", domainQualityService.extractDomainFromUrl("http://stripe.com:8080/jobs"));
        assertEquals("acme-tech.org", domainQualityService.extractDomainFromUrl("www.acme-tech.org"));
        assertEquals("acme-tech.org", domainQualityService.extractDomainFromUrl("acme-tech.org"));
        assertNull(domainQualityService.extractDomainFromUrl(null));
        assertNull(domainQualityService.extractDomainFromUrl("   "));
    }

    @Test
    @DisplayName("matchesWebsiteDomain returns true when organizational email matches website")
    void matchesWebsiteDomain_matchesIdenticalDomain() {
        assertTrue(domainQualityService.matchesWebsiteDomain("careers@uber.com", "https://www.uber.com"));
        assertTrue(domainQualityService.matchesWebsiteDomain("recruiter@stripe.com", "https://stripe.com/about"));
        assertTrue(domainQualityService.matchesWebsiteDomain("jobs@acme-tech.org", "http://acme-tech.org:3000"));
    }

    @Test
    @DisplayName("matchesWebsiteDomain handles corporate subdomains")
    void matchesWebsiteDomain_matchesSubdomains() {
        // Email subdomain matches website
        assertTrue(domainQualityService.matchesWebsiteDomain("recruiter@jobs.uber.com", "https://uber.com"));
        // Website subdomain matches email domain
        assertTrue(domainQualityService.matchesWebsiteDomain("hr@stripe.com", "https://careers.stripe.com"));
    }

    @Test
    @DisplayName("matchesWebsiteDomain returns false for non-matching corporate domains")
    void matchesWebsiteDomain_returnsFalseForMismatch() {
        assertFalse(domainQualityService.matchesWebsiteDomain("hr@uber.com", "https://lyft.com"));
        assertFalse(domainQualityService.matchesWebsiteDomain("careers@google.com", "https://amazon.com"));
    }

    @Test
    @DisplayName("matchesWebsiteDomain returns false for personal email providers even if website matches (anti-spoofing heuristic)")
    void matchesWebsiteDomain_returnsFalseForPersonalEmailProviders() {
        assertFalse(domainQualityService.matchesWebsiteDomain("founder@gmail.com", "https://gmail.com"));
        assertFalse(domainQualityService.matchesWebsiteDomain("ceo@yahoo.com", "https://yahoo.com"));
    }

    @Test
    @DisplayName("matchesWebsiteDomain returns false when website is null or blank (no penalty)")
    void matchesWebsiteDomain_returnsFalseWhenWebsiteMissing() {
        assertFalse(domainQualityService.matchesWebsiteDomain("hr@uber.com", null));
        assertFalse(domainQualityService.matchesWebsiteDomain("hr@uber.com", ""));
        assertFalse(domainQualityService.matchesWebsiteDomain("hr@uber.com", "   "));
    }
}
