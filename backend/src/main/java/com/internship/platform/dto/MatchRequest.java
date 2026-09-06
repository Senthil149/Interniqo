package com.internship.platform.dto;

import java.util.List;

public class MatchRequest {
    private Object resume;
    private List<MatchInternshipItem> internships;

    public MatchRequest() {}

    public MatchRequest(Object resume, List<MatchInternshipItem> internships) {
        this.resume = resume;
        this.internships = internships;
    }

    public Object getResume() {
        return resume;
    }

    public void setResume(Object resume) {
        this.resume = resume;
    }

    public List<MatchInternshipItem> getInternships() {
        return internships;
    }

    public void setInternships(List<MatchInternshipItem> internships) {
        this.internships = internships;
    }
}
