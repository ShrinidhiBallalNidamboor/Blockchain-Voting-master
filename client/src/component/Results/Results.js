// Node modules
import React, { Component } from "react";
import { Link } from "react-router-dom";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

// CSS
import "./Results.css";

var administration;
var current;

export default class Result extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      candidateCount: undefined,
      constituency: null,
      candidates: [],
      isElStarted: false,
      isElEnded: false,
      currentVoter: {
        address: undefined,
        name: null,
        phone: null,
        constituency: null,
        hasVoted: false,
        isVerified: false,
        isRegistered: false,
      },
    };
  }
  componentDidMount = async () => {
    // refreshing once
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, ElectionInstance: instance, account: accounts[0] });

      // Get total number of candidates
      const candidateCount = await this.state.ElectionInstance.methods
        .getTotalCandidate()
        .call();
      this.setState({ candidateCount: candidateCount });

      // Get start and end values
      const start = await this.state.ElectionInstance.methods.getStart().call();
      this.setState({ isElStarted: start });
      const end = await this.state.ElectionInstance.methods.getEnd().call();
      this.setState({ isElEnded: end });

      const voter = await this.state.ElectionInstance.methods
        .voterDetails(this.state.account)
        .call();
      this.setState({
        currentVoter: {
          address: voter.voterAddress,
          name: voter.name,
          phone: voter.phone,
          constituency: voter.constituency,
          hasVoted: voter.hasVoted,
          isVerified: voter.isVerified,
          isRegistered: voter.isRegistered,
        },
      });

      // Admin account and verification
      const admin = await this.state.ElectionInstance.methods.getAdmin().call();
      administration = admin;
      current = this.state.account;
      if (this.state.account === admin) {
        this.setState({ isAdmin: true });
        for (let i = 1; i <= this.state.candidateCount; i++) {
          const candidate = await this.state.ElectionInstance.methods
            .candidateDetails(i - 1)
            .call();
          this.state.candidates.push({
            id: candidate.candidateId,
            header: candidate.header,
            slogan: candidate.slogan,
            constituency: candidate.constituency,
            random: candidate.random,
            random_array: candidate.random_array,
            voteCount: candidate.voteCount,
          });
        }
      }
      else
      for (let i = 1; i <= this.state.candidateCount; i++) {
        const candidate = await this.state.ElectionInstance.methods
          .candidateDetails(i - 1)
          .call();
        if(candidate.constituency===this.state.currentVoter.constituency)
        this.state.candidates.push({
          id: candidate.candidateId,
          header: candidate.header,
          slogan: candidate.slogan,
          constituency: candidate.constituency,
          random: candidate.random,
          random_array: candidate.random_array,
          voteCount: candidate.voteCount,
        });
      }

      this.setState({ candidates: this.state.candidates });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
        <br />
        <div>
          {!this.state.isElStarted && !this.state.isElEnded ? (
            <NotInit />
          ) : this.state.isElStarted && !this.state.isElEnded ? (
            <div className="container-item attention">
              <center>
                <h3>The election is being conducted at the movement.</h3>
                <p>Result will be displayed once the election has ended.</p>
                <p>Go ahead and cast your vote {"(if not already)"}.</p>
                <br />
                <Link
                  to="/Voting"
                  style={{ color: "black", textDecoration: "underline" }}
                >
                  Voting Page
                </Link>
              </center>
            </div>
          ) : !this.state.isElStarted && this.state.isElEnded ? (
            displayResults(this.state.candidates)
          ) : null}
        </div>
      </>
    );
  }
}

function displayWinner(candidates) {
  for(let i=0;i<candidates.length;i++){
    let arr=candidates[i].random_array.split(' ');
    let X=[];
    let sum = 0;
    for(let j=1;j<arr.length;j++){
      X.push(+arr[j])
    }
    //MPC simulation
    let modulus = 1000;
    for (let i = 0; i < X.length; i++) {
      sum = (sum + X[i]) % modulus;
    }
    candidates[i].random=sum;
  }
  let party = [];
  let count = [];
  let winner = '';
  for (let i = 0; i < candidates.length; i++) {
    let valid = 0;
    for (let j = 0; j < party.length; j++) {
      if(candidates[i].constituency===party[j]){
        valid = 1;
        break;
      }
    }
    if(valid === 0){
      party.push(candidates[i].constituency);
      count.push('');
    }
  }
  for (let i = 0; i < party.length; i++) {
    let maxVoteRecived = 0;
    for (let j = 0; j < candidates.length; j++) {
      if(party[i]===candidates[j].constituency&&maxVoteRecived<(candidates[j].voteCount-candidates[j].random)){
        maxVoteRecived=(candidates[j].voteCount-candidates[j].random);
      }
    }
    for (let j = 0; j < candidates.length; j++) {
      if(party[i]===candidates[j].constituency&&maxVoteRecived===(candidates[j].voteCount-candidates[j].random)){
        count[i]=candidates[j].slogan;
      }
    }
  }
  let parties = [];
  let value = [];
  for (let i = 0; i < count.length; i++) {
    let valid = 0;
    for(let j = 0; j < parties.length; j++){
      if(parties[j]===count[i]){
        valid = 1;
        break;
      }
    }
    if(valid === 0){
      parties.push(count[i]);
      value.push(0);
    }
  }
  let maxVoteRecived = 0;
  for (let i = 0; i < parties.length; i++) {
    for (let j = 0; j < count.length; j++) {
      if(parties[i]===count[j]){
        value[i]+=1;
        if(maxVoteRecived<value[i]){
          maxVoteRecived=value[i];
          winner=parties[i];
        }
      }
    }
  }
  return (<>
    <div className="container-winner">
      <div className="winner-info">
        <p className="winner-tag">Winner!</p>
        <h2> {winner}</h2>
      </div>
      <div className="winner-votes">
        <div className="votes-tag">Total Votes: </div>
        <div className="vote-count">{maxVoteRecived}</div>
      </div>
    </div>
  </>);
}

export function displayResults(candidates) {
  const renderResults = (candidate) => {
    return (
      <tr>
        <td>{candidate.id}</td>
        <td>{candidate.header}</td>
        <td>{candidate.voteCount-candidate.random}</td>
      </tr>
    );
  };
  return (
    <>
      {candidates.length > 0 ? (
        <div className="container-main">{displayWinner(candidates)}</div>
      ) : null}
      <div className="container-main" style={{ borderTop: "1px solid" }}>
        <h2>Results</h2>
        <small>Total candidates: {candidates.length}</small>
        {candidates.length < 1 ? (
          <div className="container-item attention">
            <center>No candidates.</center>
          </div>
        ) : (
          <>
            <div className="container-item">
              <table>
                <tr>
                  <th>Id</th>
                  <th>Candidate</th>
                  <th>Votes</th>
                </tr>
                {candidates.map(renderResults)}
              </table>
            </div>
            <div
              className="container-item"
              style={{ border: "1px solid black" }}
            >
              <center>That is all.</center>
            </div>
          </>
        )}
      </div>
    </>
  );
}
