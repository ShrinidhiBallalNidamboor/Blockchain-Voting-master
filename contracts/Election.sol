// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.9.0;

contract Election {
    address public admin;
    uint256 candidateCount;
    uint256 voterCount;
    bool start;
    bool end;
    uint256 private nonce;
    uint256[] private arr;

    constructor() public {
        // Initilizing default values
        admin = msg.sender;
        candidateCount = 0;
        voterCount = 0;
        start = false;
        end = false;
    }

    function getAdmin() public view returns (address) {
        // Returns account address used to deploy contract (i.e. admin)
        return admin;
    }

    modifier onlyAdmin() {
        // Modifier for only admin access
        require(msg.sender == admin);
        _;
    }
    // Modeling a candidate
    struct Candidate {
        uint256 candidateId;
        string header;
        string slogan;
        string constituency;
        string random_array;
        uint256 random;
        uint256 voteCount;
    }
    mapping(uint256 => Candidate) public candidateDetails;

    // Adding new candidates
    function addCandidate(string memory _header, string memory _slogan, string memory _constituency)
        public
        // Only admin can add
        onlyAdmin
    {
        Candidate memory newCandidate =
            Candidate({
                candidateId: candidateCount,
                header: _header,
                slogan: _slogan,
                constituency: _constituency,
                random: 0,
                random_array: '',
                voteCount: 0
            });
        candidateDetails[candidateCount] = newCandidate;
        candidateCount += 1;
    }

    // Modeling a Election Details
    struct ElectionDetails {
        string adminName;
        string adminEmail;
        string adminTitle;
        string electionTitle;
        string organizationTitle;
    }
    ElectionDetails electionDetails;

    function setElectionDetails(
        string memory _adminName,
        string memory _adminEmail,
        string memory _adminTitle,
        string memory _electionTitle,
        string memory _organizationTitle
    )
        public
        // Only admin can add
        onlyAdmin
    {
        electionDetails = ElectionDetails(
            _adminName,
            _adminEmail,
            _adminTitle,
            _electionTitle,
            _organizationTitle
        );
        start = true;
        end = false;
    }

    // Get Elections details
    function getAdminName() public view returns (string memory) {
        return electionDetails.adminName;
    }

    function getAdminEmail() public view returns (string memory) {
        return electionDetails.adminEmail;
    }

    function getAdminTitle() public view returns (string memory) {
        return electionDetails.adminTitle;
    }

    function getElectionTitle() public view returns (string memory) {
        return electionDetails.electionTitle;
    }

    function getOrganizationTitle() public view returns (string memory) {
        return electionDetails.organizationTitle;
    }

    // Get candidates count
    function getTotalCandidate() public view returns (uint256) {
        // Returns total number of candidates
        return candidateCount;
    }

    // Get voters count
    function getTotalVoter() public view returns (uint256) {
        // Returns total number of voters
        return voterCount;
    }

    function uint256ToString(uint256 _num) public pure returns (string memory) {
        if (_num == 0) {
            return "0";
        }
        uint256 temp = _num;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_num != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (_num % 10)));
            _num /= 10;
        }
        return string(buffer);
    }

    function concatenate(string memory _str1, string memory _str2) public pure returns (string memory) {
        bytes memory str1 = bytes(_str1);
        bytes memory str2 = bytes(_str2);
        bytes memory result = new bytes(str1.length + str2.length);
        uint256 k = 0;
        for (uint256 i = 0; i < str1.length; i++) {
            result[k] = str1[i];
            k++;
        }
        for (uint256 i = 0; i < str2.length; i++) {
            result[k] = str2[i];
            k++;
        }
        return string(result);
    }

    // Modeling a voter
    struct Voter {
        address voterAddress;
        string name;
        string phone;
        string constituency;
        bool isVerified;
        bool hasVoted;
        bool isRegistered;
    }
    address[] public voters; // Array of address to store address of voters
    mapping(address => Voter) public voterDetails;

    // Request to be added as voter
    function registerAsVoter(address _address, string memory _name, string memory _phone, string memory _constituency) public {
        Voter memory newVoter =
            Voter({
                voterAddress: _address,
                name: _name,
                phone: _phone,
                constituency: _constituency,
                hasVoted: false,
                isVerified: false,
                isRegistered: true
            });
        voterDetails[_address] = newVoter;
        voters.push(_address);
        voterCount += 1;
    }

    // Verify voter
    function verifyVoter(bool _verifedStatus, address voterAddress)
        public
        // Only admin can verify
        onlyAdmin
    {
        voterDetails[voterAddress].isVerified = _verifedStatus;
    }

    //random
    function getRandom() public returns (uint256) {
        nonce++;
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))) % 100;
    }

    // Vote
    function vote(uint256 candidateId) public {
        require(voterDetails[msg.sender].hasVoted == false);
        require(voterDetails[msg.sender].isVerified == true);
        require(start == true);
        require(end == false);
        
        uint256 total = getTotalCandidate();
        candidateDetails[candidateId].voteCount+=1;
        for(uint256 i=0;i<total;i++){
            uint256 temp=getRandom();
            candidateDetails[i].voteCount+=temp;
            candidateDetails[i].random_array=concatenate(candidateDetails[i].random_array, concatenate(' ', uint256ToString(temp)));
        }
        voterDetails[msg.sender].hasVoted = true;
    }

    // End election
    function endElection() public onlyAdmin {
        end = true;
        start = false;
    }

    // Get election start and end values
    function getStart() public view returns (bool) {
        return start;
    }

    function getEnd() public view returns (bool) {
        return end;
    }
}
