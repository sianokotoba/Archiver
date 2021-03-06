const fs = require('fs');
const expect = require('chai').expect;
const rmdir = require('rimraf').sync;
const vcfront = require('../../utilities/vcfrontend');
const vcback = require('../../utilities/vcbackend');

describe('Actions', function () {
  const dirPath = `./ArchiveTest`;
  const fileName = 'File'
  const filePath = `${dirPath}/File.txt`;
  const contents = 'banana peel';
  const message = 'ayyyyy commit!';
  const _getSha1Hash = vcfront.getSha1Hash;
  const _initNewProject = vcfront.initNewProject;
  const _addNewFile = vcfront.addNewFile;
  const _commitFileChanges = vcfront.commitFileChanges;
  const _mergeFileChanges = vcback.mergeFileChanges;
  const _pullDataFromServer = vcback.pullDataFromServer;

  beforeEach(function () { rmdir(dirPath) });
  afterEach(function () { rmdir(dirPath) });

  describe('Initialize A New Project:', function () {
    it('Returns false when directory does not exist', function () {
      const returnValue = _initNewProject(dirPath);
      expect(returnValue).to.be.false;
    })

    it('Returns true when directory does exist', function () {
      fs.mkdirSync(dirPath);
      const returnValue = _initNewProject(dirPath);
      expect(returnValue).to.be.true;
    })

    it('Creates a hidden directory for version control', function () {
      fs.mkdirSync(dirPath);
      const returnValue = _initNewProject(dirPath);
      const stat = fs.statSync(`${dirPath}/.archive`);
      expect(returnValue).to.be.true;
      expect(stat).to.exist;
      expect(stat.isDirectory()).to.be.true;
    })
  }) // end initialize functionality

  describe('Add A New File To The Archive:', function () {
    beforeEach(function () {
      fs.mkdirSync(dirPath);
      _initNewProject(dirPath);
      fs.writeFileSync(filePath, contents, 'utf-8');
    });

    it('Returns false if a directory is passed in', function () {
      const returnValue = _addNewFile(dirPath);
      expect(returnValue).to.be.false;
    })

    it('Returns a valid hash of the file if successful', function () {
      const hash = _addNewFile(filePath);
      expect(hash).to.be.equal(_getSha1Hash(`${fileName}${contents}`));
    })

    it('Creates an object directory with the object in the hidden archive', function () {
      const hash = _addNewFile(filePath);

      // Test the directory created
      const stat = fs.statSync(`${dirPath}/.archive/objects`);
      expect(stat).to.exist;
      expect(stat.isDirectory()).to.be.true;

      // Test the object created (TODO: Isolate this test)
      const objDirName = hash.slice(0, 2);
      const objFileName = hash.slice(2);

      const statDir = fs.statSync(`${dirPath}/.archive/objects/${objDirName}`);
      const statFile = fs.statSync(`${dirPath}/.archive/objects/${objDirName}/${objFileName}`);
      expect(statDir).to.exist;
      expect(statDir.isDirectory()).to.be.true;

      expect(statFile).to.exist;
      expect(statFile.isFile()).to.be.true;
    })

    it('Creates a spot in the index to track the file', function () {
      const hash = _addNewFile(filePath);

      // Test to make sure index was created
      const stat = fs.statSync(`${dirPath}/.archive/index.txt`);
      expect(stat).to.exist;
      expect(stat.isFile()).to.be.true;

      // Test the contents of the file
      const indexContents = fs.readFileSync(`${dirPath}/.archive/index.txt`, 'utf-8');
      const indexHash = indexContents.split('/').shift();
      const indexFileName = indexContents.split('/').pop().replace(/\n$/, "");

      expect(indexHash).to.be.equal(hash);
      expect(indexFileName).to.be.equal(fileName);
    })
  }) // end add functionality

  describe('Commit a file to the archive: ', function () {
    beforeEach(function () {
      fs.mkdirSync(dirPath);
      _initNewProject(dirPath);
      fs.writeFileSync(filePath, contents, 'utf-8');
      _addNewFile(filePath);
    })

    it('Returns a valid hash of the commit if successful', function () {
      const commitHash = _commitFileChanges(filePath, message);
      expect(commitHash).to.be.equal(_getSha1Hash(`${fileName}${contents}${message}`))
    })

    it('Creates a valid archive object to store the commit information', function () {
      const commitHash = _commitFileChanges(filePath, message);
      const directoryUrl = `${dirPath}/.archive/objects/${commitHash.slice(0, 2)}`;
      const statDir = fs.statSync(directoryUrl);
      const statFile = fs.statSync(`${directoryUrl}/${commitHash.slice(2)}`);

      expect(statDir).to.exist;
      expect(statDir.isDirectory()).to.be.true;
      expect(statFile).to.exist;
      expect(statFile.isFile()).to.be.true;
    })

    it('Creates a file with the correct information about the commit', function () {
      const commitHash = _commitFileChanges(filePath, message);
      const directoryUrl = `${dirPath}/.archive/objects/${commitHash.slice(0, 2)}`;
      const fileUrl = `${directoryUrl}/${commitHash.slice(2)}`;
      const fileName = filePath.split('/').pop().split('.').shift();

      // date: Mon Nov 21 2016 12:02:39 GMT-0500 (EST)/
      // msg: ayyyyy commit!/
      // committer: /
      // file: a5d3155fbc93ecb2fe4838b2d78da5e8e6b74a24/
      // File
      const fileContents = fs.readFileSync(fileUrl, 'utf-8');
      const fileContentsArr = fileContents.split('/');

      // check for valid contents and that it's properly sized
      fileContentsArr.forEach(content => {
        expect(content).to.be.a('string');
      })
      expect(fileContentsArr.length).to.be.equal(5);

      const date = fileContentsArr[0];
      const msg = fileContentsArr[1];
      // TODO: Committer is currently not being added
      const committer = fileContentsArr[2];
      const fileHash = fileContentsArr[3];
      const filename = fileContentsArr[4];

      expect(msg.split(':')[1]).to.be.equal(message);
      expect(fileHash.split(':')[1]).to.be.equal(_getSha1Hash(`${fileName}${contents}`));
      // TODO: Where is the filename being added to the commit file?
      expect(filename).to.be.equal(fileName);
      // TODO: Check the committer when it is actually being used
    })

    it('Creates a valid refs folder to store versioning position', function () {
      const commitHash = _commitFileChanges(filePath, message);
      const fileName = filePath.split('/').pop().split('.').shift();
      const refsUrl = `${dirPath}/.archive/refs`

      const statRefsDir = fs.statSync(refsUrl);
      const statRefs = fs.statSync(`${refsUrl}/${fileName}`);

      expect(statRefsDir).to.exist;
      expect(statRefsDir.isDirectory()).to.be.true;
      expect(statRefs).to.exist;
      expect(statRefs.isFile()).to.be.true;

      const refHash = fs.readFileSync(`${refsUrl}/${fileName}`, 'utf-8');
      expect(refHash).to.be.equal(commitHash);
    });
  }); // end commit functionality

  describe('Merge a file with and without conflicts: ', function () {
    beforeEach(function () {
      fs.mkdirSync(dirPath);
      _initNewProject(dirPath);
      fs.writeFileSync(filePath, contents, 'utf-8');
      _addNewFile(filePath);
      _commitFileChanges(filePath, message);
    });

    it('If the local and server are at the same commit, nothing happens', function () {
      const hashes = _getSha1Hash(`${fileName}${contents}${message}`);
      const merged = _mergeFileChanges(filePath, hashes, hashes, contents);
      expect(merged).to.be.false;
    });

    //if local is different and server is same
    it('If the local is changed, but server is ancestor commit', function () {
      const hashes = _getSha1Hash(`${fileName}${contents}${message}`);
      fs.appendFileSync(filePath, ' green banana');
      const merged = _mergeFileChanges(filePath, hashes, hashes, contents);
      expect(merged).to.be.false;
    });

    //if local is same and server is different
    it('If the local is the same as ancestor, but server is ahead', function () {
      const localHash = _getSha1Hash(`${fileName}${contents}${message}`);
      const serverHash = _getSha1Hash(`${fileName}${contents} yellow bananas${message}`);
      const merged = _mergeFileChanges(filePath, localHash, serverHash, `${contents} yellow bananas`);
      expect(merged).to.be.true;
      const refHash = fs.readFileSync(`${dirPath}/.archive/refs/${fileName}`, 'utf-8');
      const newHash = _getSha1Hash(`${fileName}${contents} yellow bananasupdating and saving all files`);
      expect(refHash).to.be.equal(newHash);
    });

    //if local and server are both different
    it('If the local and the server are different then the ancestor', function () {
      const localHash = _getSha1Hash(`${fileName}${contents}${message}`);
      fs.appendFileSync(filePath, ' green banana');
      const serverHash = _getSha1Hash(`${fileName}${contents} yellow bananas${message}`);
      const merged = _mergeFileChanges(filePath, localHash, serverHash, `${contents} yellow bananas`);
      expect(merged).to.be.true;
      const refHash = fs.readFileSync(`${dirPath}/.archive/refs/${fileName}`, 'utf-8');
      const newHash = _getSha1Hash(`${fileName}${contents} yellow bananasupdating and saving all files`);
      expect(refHash).to.be.equal(newHash);
    });
  }); // end merge functionality

 describe('pull a file from the database: ', function () {
    beforeEach(function () {
      fs.mkdirSync(dirPath);
      _initNewProject(dirPath);
      fs.writeFileSync(filePath, contents, 'utf-8');
      _addNewFile(filePath);
      _commitFileChanges(filePath, message);
    });

    // it('If the local and server are at the same commit, nothing happens', function () {
    //   return _pullDataFromServer('./Recipes/zaz')
    //     .then(res => {
    //       fs.writeFileSync(`./dbInfo.txt`, JSON.stringify(res), 'utf-8');
    //     });
    // });
 });
});
