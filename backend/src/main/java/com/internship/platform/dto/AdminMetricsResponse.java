package com.internship.platform.dto;

public class AdminMetricsResponse {

    private long totalUsers;
    private long totalStudents;
    private long totalCompanies;
    private long totalAdmins;
    private long totalInternships;
    private long activeInternships;
    private long closedInternships;
    private long totalApplications;
    private long highRiskPostings;
    private long mediumRiskPostings;
    private long lowRiskPostings;
    private long totalEmailVerifications;
    private long verifiedCompanies;
    private long totalBlockchainCredentials;

    public AdminMetricsResponse() {
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalCompanies() {
        return totalCompanies;
    }

    public void setTotalCompanies(long totalCompanies) {
        this.totalCompanies = totalCompanies;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }

    public void setTotalAdmins(long totalAdmins) {
        this.totalAdmins = totalAdmins;
    }

    public long getTotalInternships() {
        return totalInternships;
    }

    public void setTotalInternships(long totalInternships) {
        this.totalInternships = totalInternships;
    }

    public long getActiveInternships() {
        return activeInternships;
    }

    public void setActiveInternships(long activeInternships) {
        this.activeInternships = activeInternships;
    }

    public long getClosedInternships() {
        return closedInternships;
    }

    public void setClosedInternships(long closedInternships) {
        this.closedInternships = closedInternships;
    }

    public long getTotalApplications() {
        return totalApplications;
    }

    public void setTotalApplications(long totalApplications) {
        this.totalApplications = totalApplications;
    }

    public long getHighRiskPostings() {
        return highRiskPostings;
    }

    public void setHighRiskPostings(long highRiskPostings) {
        this.highRiskPostings = highRiskPostings;
    }

    public long getMediumRiskPostings() {
        return mediumRiskPostings;
    }

    public void setMediumRiskPostings(long mediumRiskPostings) {
        this.mediumRiskPostings = mediumRiskPostings;
    }

    public long getLowRiskPostings() {
        return lowRiskPostings;
    }

    public void setLowRiskPostings(long lowRiskPostings) {
        this.lowRiskPostings = lowRiskPostings;
    }

    public long getTotalEmailVerifications() {
        return totalEmailVerifications;
    }

    public void setTotalEmailVerifications(long totalEmailVerifications) {
        this.totalEmailVerifications = totalEmailVerifications;
    }

    public long getVerifiedCompanies() {
        return verifiedCompanies;
    }

    public void setVerifiedCompanies(long verifiedCompanies) {
        this.verifiedCompanies = verifiedCompanies;
    }

    public long getTotalBlockchainCredentials() {
        return totalBlockchainCredentials;
    }

    public void setTotalBlockchainCredentials(long totalBlockchainCredentials) {
        this.totalBlockchainCredentials = totalBlockchainCredentials;
    }
}
