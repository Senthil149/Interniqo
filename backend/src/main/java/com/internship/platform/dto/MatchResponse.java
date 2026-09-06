package com.internship.platform.dto;

import java.util.List;

public class MatchResponse {

    private List<MatchResultItem> matches;
    private Boolean sorted;

    public MatchResponse() {}

    public MatchResponse(List<MatchResultItem> matches, Boolean sorted) {
        this.matches = matches;
        this.sorted = sorted;
    }

    public List<MatchResultItem> getMatches() {
        return matches;
    }

    public void setMatches(List<MatchResultItem> matches) {
        this.matches = matches;
    }

    public Boolean getSorted() {
        return sorted;
    }

    public void setSorted(Boolean sorted) {
        this.sorted = sorted;
    }
}
