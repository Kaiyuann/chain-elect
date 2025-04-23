// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Poll {
        address creator;
        bool allowLiveResults;
        bool isActive;
        uint optionCount;
    }

    uint public pollCount;
    mapping(uint => Poll) public polls;
    mapping(uint => mapping(bytes32 => bool)) public validTokens;    // pollId => tokenHash => isValid
    mapping(uint => mapping(bytes32 => bool)) public usedTokens;     // pollId => tokenHash => isUsed
    mapping(uint => mapping(uint => uint)) public voteCounts;        // pollId => optionId => count

    /// Event for frontend listening
    event PollCreated(uint pollId, address creator);
    event PollClosed(uint pollId);
    event VoteCasted(uint pollId, uint optionId);

    /// Create a new poll
    function createPoll(bool allowLiveResults, uint optionCount) public {
        require(optionCount > 1, "Must have at least 2 options");

        polls[pollCount] = Poll({
            creator: msg.sender,
            allowLiveResults: allowLiveResults,
            isActive: true,
            optionCount: optionCount
        });

        emit PollCreated(pollCount, msg.sender);
        pollCount++;
    }

    /// Upload valid hashed tokens (token hashes are issued off-chain)
    function addValidTokens(uint pollId, bytes32[] memory tokenHashes) public {
        require(msg.sender == polls[pollId].creator, "Only poll creator can add tokens");
        require(polls[pollId].isActive, "Poll is closed");

        for (uint i = 0; i < tokenHashes.length; i++) {
            validTokens[pollId][tokenHashes[i]] = true;
        }
    }

    /// Vote using raw token (will be hashed inside)
    function vote(uint pollId, string memory rawToken, uint optionId) public {
        require(polls[pollId].isActive, "Poll is closed");
        require(optionId < polls[pollId].optionCount, "Invalid option");

        bytes32 tokenHash = keccak256(abi.encodePacked(rawToken));

        require(validTokens[pollId][tokenHash], "Invalid token");
        require(!usedTokens[pollId][tokenHash], "Token already used");

        usedTokens[pollId][tokenHash] = true;
        voteCounts[pollId][optionId]++;

        emit VoteCasted(pollId, optionId);
    }

    /// Close the poll (creator only)
    function closePoll(uint pollId) public {
        require(msg.sender == polls[pollId].creator, "Not the poll creator");
        require(polls[pollId].isActive, "Poll already closed");

        polls[pollId].isActive = false;
        emit PollClosed(pollId);
    }

    /// View poll results (only if allowed or poll is closed)
    function getResults(uint pollId) public view returns (uint[] memory) {
        require(
            polls[pollId].allowLiveResults || !polls[pollId].isActive,
            "Live results not allowed yet."
        );

        uint optionCount = polls[pollId].optionCount;
        uint[] memory results = new uint[](optionCount);

        for (uint i = 0; i < optionCount; i++) {
            results[i] = voteCounts[pollId][i];
        }

        return results;
    }
}
