// @flow
import React, { Component } from 'react';
import styles from './Home.css';
import {authenticateUser, removeRedErrors} from '../reducers/login';
import {connect} from 'react-redux';
import { Link, Router, hashHistory } from 'react-router';


export class Home extends Component {
  constructor(props) {
    super(props)
    this.onUserSubmit = this.onUserSubmit.bind(this);
    this.removeErrors = this.removeErrors.bind(this);

  }

  onUserSubmit(event) {
    event.preventDefault();
    const userCred = {
        email: event.target.email.value,
        password: event.target.password.value,
    }
    this.props.loginUser(userCred);
    this.removeErrors();
  }

  removeErrors(){
    setTimeout(this.props.threeSecondError, 3000)
  }

  componentDidUpdate() {
    if(this.props.login.email){
      hashHistory.push('/mainHome');
    }
  }

  render() {
    return (
      <div className={styles.container} >
        <div className="row">
          <div className="col s12">
            <img className="home_logo" src="../public/media/archiver_logo_words_2.png" height="300px" />
          </div>
          <br />
          <br />
          <form className="col s12 valign" onSubmit={this.onUserSubmit}>
            <div className="row email-margin-bottom-zero">
              <div className="col s3"></div>
              <div className="input-field col s6">
                <i className="material-icons prefix cyan-text">account_circle</i>
                <input placeholder="Username" id="email" type="text" className="validate remove-bottom-padding" />
                {this.props.login.incorrectUser ? <h6 className="red-error">We could not find an account with that username</h6> : <h6></h6>}
              </div>
            </div>
            <div className="row email-margin-bottom-zero">
              <div className="col s3"></div>

              <div className="input-field col s6">
                <i className="material-icons prefix cyan-text">vpn_key</i>
                <input placeholder="Password" id="password" type="password" className="validate" />
                 {this.props.login.incorrectPassword ? <h6 className="red-error">Incorrect password</h6> : <h6></h6>}
              </div>

            </div>

            <div className="row home_button1">
              <div className="col s12">
                <button className="waves-effect waves-light btn cyan">submit</button>
                <br />
              </div>
            </div>
          </form>
          <div className="row home_button2">
            <div className="col s12 remove-padding-button">
                <button className="waves-effect waves-light btn orange darken-3" onClick={() => hashHistory.push("/signup")}>signup</button>

            </div>
          </div>
        </div>
      </div>
    );
  }
}

/* ---------------- CONTAINER --------------------*/

function mapStateToProps(state){
  return {
    login: state.login
  }
}


function mapDispatchToProps(dispatch) {
  return {
      loginUser: (userCred) => {
          dispatch(authenticateUser(userCred))
      },
      threeSecondError: () => {
        dispatch(removeRedErrors());
      }

  }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Home);
