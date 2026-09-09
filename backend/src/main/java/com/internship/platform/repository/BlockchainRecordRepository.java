package com.internship.platform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internship.platform.entity.BlockchainRecord;
import com.internship.platform.entity.Credential;

@Repository
public interface BlockchainRecordRepository extends JpaRepository<BlockchainRecord, Long> {

    Optional<BlockchainRecord> findByCredential(Credential credential);

    Optional<BlockchainRecord> findByTransactionHash(String transactionHash);

    List<BlockchainRecord> findAllByOrderByTimestampDesc();
}
