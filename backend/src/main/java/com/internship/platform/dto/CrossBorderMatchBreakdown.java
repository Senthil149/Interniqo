package com.internship.platform.dto;

/**
 * Encapsulates the international cross-border match criteria for an internship recommendation:
 * - Country match
 * - Work-mode match
 * - Duration match
 * - Stipend match
 * - Visa match
 * - Relocation match
 * - Skill match
 *
 * Each indicator strictly reports one of:
 * - MATCHED
 * - PARTIALLY MATCHED
 * - NOT MATCHED
 * - NOT SPECIFIED (when neither student preference nor internship specifies this dimension)
 */
public class CrossBorderMatchBreakdown {

    public static class MatchIndicator {
        private String status; // "MATCHED", "PARTIALLY MATCHED", "NOT MATCHED", "NOT SPECIFIED"
        private String message;

        public MatchIndicator() {}

        public MatchIndicator(String status, String message) {
            this.status = status;
            this.message = message;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    private MatchIndicator countryMatch;
    private MatchIndicator workModeMatch;
    private MatchIndicator durationMatch;
    private MatchIndicator stipendMatch;
    private MatchIndicator visaMatch;
    private MatchIndicator relocationMatch;
    private MatchIndicator skillMatch;

    public MatchIndicator getCountryMatch() {
        return countryMatch;
    }

    public void setCountryMatch(MatchIndicator countryMatch) {
        this.countryMatch = countryMatch;
    }

    public MatchIndicator getWorkModeMatch() {
        return workModeMatch;
    }

    public void setWorkModeMatch(MatchIndicator workModeMatch) {
        this.workModeMatch = workModeMatch;
    }

    public MatchIndicator getDurationMatch() {
        return durationMatch;
    }

    public void setDurationMatch(MatchIndicator durationMatch) {
        this.durationMatch = durationMatch;
    }

    public MatchIndicator getStipendMatch() {
        return stipendMatch;
    }

    public void setStipendMatch(MatchIndicator stipendMatch) {
        this.stipendMatch = stipendMatch;
    }

    public MatchIndicator getVisaMatch() {
        return visaMatch;
    }

    public void setVisaMatch(MatchIndicator visaMatch) {
        this.visaMatch = visaMatch;
    }

    public MatchIndicator getRelocationMatch() {
        return relocationMatch;
    }

    public void setRelocationMatch(MatchIndicator relocationMatch) {
        this.relocationMatch = relocationMatch;
    }

    public MatchIndicator getSkillMatch() {
        return skillMatch;
    }

    public void setSkillMatch(MatchIndicator skillMatch) {
        this.skillMatch = skillMatch;
    }
}
