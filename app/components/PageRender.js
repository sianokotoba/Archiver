import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import styles from './PageRender.css';
import { setCurrentCommit, setCurrentProject } from '../reducers/currentsReducer';
import axios from 'axios';
import * as FEActions from '../../utilities/vcfrontend';
import { fetchUserProjects } from '../reducers/projects_list';
import UpdateProjectPopup from './UpdateProjectPopup';
import Moment from 'moment';

// Additional modules for rendering a file
import * as fs from 'fs';

export class PageRender extends Component {
  constructor(props) {
    super(props);
    this.state = {
      updated: false
    }
    this.onClickLocalFileUpdate = this.onClickLocalFileUpdate.bind(this);
    this.onClickAddFile = this.onClickAddFile.bind(this);
    this.onClickAddArchive = this.onClickAddArchive.bind(this);
  }

  onClickAddArchive(event) {
    console.log('adding archive to local machine');
    const project = this.props.currents
      && this.props.currents.currentProject
      ? this.props.currents.currentProject : undefined;
    project && axios.get(`http://localhost:3000/api/vcontrol/${project.id}`)
      .then(project => {
        const projectData = project.data[0];
        // Note the object structure
        // project.commits[0].blob.files[0];

        // create the directory if it doesn't already exist
        const dirPath = `./${projectData.name}`;
        try {
          fs.statSync(dirPath).isDirectory()
        } catch (err) {
          fs.mkdirSync(dirPath);
        }
        // create the file if it doesn't already exist
        // NOTE: WILL CONTAIN MOST RECENT DATA
        const commits = projectData.commits;
        const fileData = commits[commits.length - 1].blob.files[0];
        const filePath = `${dirPath}/${fileData.file_name}.txt`
        fs.writeFileSync(filePath, fileData.file_contents, 'utf-8');

        // then create the .archive directory
        try {
          fs.statSync(`${dirPath}/.archive`).isDirectory()
        } catch (err) {
          FEActions.initNewProject(dirPath);
        }

        // then create all the .archive files
        projectData.commits.forEach((commit, index) => {
          // commitFileChanges(filePath, message, mergeHash, date)
          const fileHash = commit.blob.hash;
          const fileContent = commit.blob.files[0].file_contents;
          FEActions.commitFileChanges(filePath, commit.message, undefined, commit.date, fileHash, fileContent);
        })
      })
  }

  onClickLocalFileUpdate(event) {
    const project = this.props.currents && this.props.currents.currentProject
      ? this.props.currents.currentProject : undefined;
    const dirPath = `./${project.name}`;
    const fileData = project ? project.commits[0].blob.files[0] : undefined;
    const filePath = project && fileData
      ? `./${project.name}/${fileData.file_name}.txt` : undefined;
    if (filePath) {
      // Check to make sure the file exists first
      try {
        fs.statSync(filePath).isFile();
      } catch (err) {
        console.log(`file ${filePath} does not exist!`);
        return false;
      }

      const commitFileContents = fileData.file_contents;
      const localFileContents = fs.readFileSync(filePath, 'utf-8');

      // Check to make sure there are changes to be sent to server
      if (commitFileContents === localFileContents) {
        console.log('no updates to be made!');
        return false;
      }

      fs.writeFileSync(filePath, commitFileContents, 'utf-8');
    }
  }

  onClickAddFile(event) {
    // Hardcode this to the current filePath since we're only doing one file
    const project = this.props.currents && this.props.currents.currentProject
      ? this.props.currents.currentProject : undefined;
    const dirPath = `./${project.name}`;
    const fileData = project ? project.commits[0].blob.files[0] : undefined;
    const filePath = project && fileData
      ? `./${project.name}/${fileData.file_name}.txt` : undefined;
    if (filePath) {
      // Check to make sure the file exists first
      try {
        fs.statSync(filePath).isFile();
      } catch (err) {
        console.log(`file ${filePath} does not exist!`);
        return false;
      }

      const commitFileContents = fileData.file_contents;
      const localFileContents = fs.readFileSync(filePath, 'utf-8');

      // Check to make sure there are changes to be sent to server
      if (commitFileContents === localFileContents) {
        console.log('no changes made!');
        return false;
      }

      const project = this.props.currents && this.props.currents.currentProject
        ? this.props.currents.currentProject : undefined;

      console.log(this.props.user);
      const newCommit = {
        previousCommit: fs.readFileSync(`./${dirPath}/.archive/refs/${fileData.file_name}`, 'utf-8'),
        // hard coded message
        date: new Date(),
        message: 'merging file updates to server',
        committer: `${this.props.user.first_name} ${this.props.user.last_name}`,
        projectId: project.id,
        file_name: fileData.file_name,
        file_contents: localFileContents
      }
      // Need to create the new objs for commit and new file
      newCommit.hash = FEActions.getSha1Hash(`${newCommit.file_name}${newCommit.file_contents}${newCommit.message}`);
      newCommit.fileHash = FEActions.getSha1Hash(`${newCommit.file_name}${newCommit.file_contents}`);
      FEActions.commitFileChanges(filePath, newCommit.message, undefined,
        newCommit.date, newCommit.fileHash, newCommit.file_contents);

      project && axios.post(`http://localhost:3000/api/vcontrol/${project.id}`, newCommit)
        .then(res => console.log(res))
        .catch(err => console.error(err));

      // Need to trigger the project_list to re-render the latest commit
      this.props.fetchProjects(this.props.user.id);
      this.state.updated = true;
      console.log(this.state);
    }
  }

  componentWillMount() {
    if (!this.props.currents.currentCommit) {
      this.props.currents && this.props.currents.setCurrentProject
        && this.props.setCurrentCommit(this.props.currents.currentProject.commits[0]);
    }
  }

  componentWillReceiveProps() {
    if (!this.props.currents.currentCommit || !this.props.currents.currentProject) {
      return;
    }
    const projCommitId = this.props.currents.currentProject.commits[0].id;
    const currentCommitId = this.props.currents.currentCommit.id;
    if (this.state.updated && projCommitId != currentCommitId) {
      this.props.setCurrentCommit(this.props.currents.currentProject.commits[0]);
      this.state.updated = false;
    }
  }

  componentDidUpdate() {
  }

  render() {
    const col6container = `col 6 ${styles.textContain}`;
    const renderText = this.props.currents && this.props.currents.currentCommit
      ? this.props.currents.currentCommit.blob.files[0].file_contents : '';
    console.log(this.props.currents)
    return (
      <div className={styles.container} >
        <div className="row">
          <div className="col 3"></div>

          <div className="main-buttons-container">
            {//<UpdateProjectPopup />
            }
            <a className="waves-effect waves-light btn single-button red" onClick={this.onClickAddArchive} id="add-archive-btn">
              <i className="material-icons right icon-margin">get_app</i>
              Download
            </a>
            <a className="waves-effect waves-light btn single-button green" onClick={this.onClickLocalFileUpdate} id="update-local-btn">
              <i className="material-icons right icon-margin">restore_page</i>
              Restore
            </a>
            <a className="waves-effect waves-light btn single-button light-blue darken-1" onClick={this.onClickAddFile} id="add-file-btn">
              <i className="material-icons right icon-margin">call_made</i>
              Update
            </a>
            {//<a className="waves-effect waves-light btn single-button yellow">
              // <i className="material-icons">open_in_new</i>
              //</a>
            }
          </div>
          {this.props.currents && this.props.currents.currentCommit
            ? <div className={col6container}>
              <br/>
              <div className="on-commit-border">
                <h5>{this.props.currents.currentProject && this.props.currents.currentProject.name}</h5>
                <div className="commit-message commit-color">{"\"" + this.props.currents.currentCommit.message + "\""}</div>
                <div className="item-commit-details"><span className="commit-message commit-info-font commit-date">{`On ${Moment(this.props.currents.currentCommit.date).format('MMMM Do')}`}</span><span className="commit-info-font">{`by ${this.props.currents.currentCommit.committer}`}</span></div>
              </div>
              <br />
              <div id="textContainer" style={{ 'minHeight': `600`, 'maxHeight': `100%`, border: '1px' }}>
                <div id="textRender" style={{ border: `5px` }}>{renderText}
                </div>
              </div>
            </div>
            : ''
          }
          <div className="col 3"></div>
        </div>
      </div>
    );
  }
}

/* ---------------- CONTAINER --------------------*/
function mapStateToProps(state) {
  return {
    user: state.login,
    mainhome: state.mainhome,
    currents: state.currents,
    projects: state.projects
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchProjects: (userId) => {
      dispatch(fetchUserProjects(userId))
    },
    setCurrentCommit: (commit) => {
      dispatch(setCurrentCommit(commit));
    }
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PageRender);
