package com.internship.platform.service;

import com.internship.platform.entity.Company;
import com.internship.platform.entity.EmailVerification;
import com.internship.platform.entity.User;
import org.springframework.stereotype.Service;

/**
 * Email verification records are owned by either a user or a company, never both or neither.
 *
 * Enforced here instead of a MySQL CHECK (XOR) because: (1) the two nullable FKs serve
 * different flows (account signup vs company inbox proof), and a CHECK would turn a domain
 * rule into an opaque SQL error; (2) callers need a clear validation message that this
 * proves inbox control only, not legal company identity; (3) keeping both columns nullable
 * lets Flyway/FK definitions stay simple and avoids CHECK-support differences across MySQL
 * versions. Always call {@link #assertExactlyOneOwner} before persist/update.
 */
@Service
public class EmailVerificationService {

    public void assertExactlyOneOwner(EmailVerification verification) {
        if (verification == null) {
            throw new IllegalArgumentException("email verification is required");
        }
        assertExactlyOneOwner(verification.getUser(), verification.getCompany());
    }

    public void assertExactlyOneOwner(User user, Company company) {
        boolean hasUser = user != null;
        boolean hasCompany = company != null;
        if (hasUser == hasCompany) {
            throw new IllegalArgumentException(
                    "email_verifications must set exactly one of user_id or company_id");
        }
    }
}
