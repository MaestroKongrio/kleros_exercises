const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
import {BlockchainData} from '../state'

describe('BlockchainData', function() {
    let blockchainData;
    let sandbox;

    beforeEach(function() {
        sandbox = sinon.createSandbox();
        sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
            started: false,
            blockNumber: 0,
            lastNonce: 0,
            pendingPongs: [],
            queuedPongs: [],
            sentPongs: [],
            state: {}
        }));
        sandbox.stub(fs, 'writeFileSync');
        blockchainData = new BlockchainData();
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should initialize with data from file', function() {
        expect(blockchainData.started).to.be.false;
        expect(blockchainData.blockNumber).to.equal(0);
        expect(blockchainData.lastNonce).to.equal(0);
        expect(blockchainData.pendingPongs).to.be.an('array').that.is.empty;
        expect(blockchainData.queuedPongs).to.be.an('array').that.is.empty;
        expect(blockchainData.sentPongs).to.be.an('array').that.is.empty;
        expect(blockchainData.state).to.be.an('object').that.is.empty;
    });

    it('should start and save data', function() {
        blockchainData.start();
        expect(blockchainData.hasStarted()).to.be.true;
        expect(fs.writeFileSync.calledOnce).to.be.true;
    });

    it('should set and get state', function() {
        const newState = { key: 'value' };
        blockchainData.setState(newState);
        expect(blockchainData.getState()).to.deep.equal(newState);
        expect(fs.writeFileSync.calledOnce).to.be.true;
    });

    it('should add and remove pending pongs', function() {
        const txHash = '0x123';
        blockchainData.addPendingPong(txHash);
        expect(blockchainData.getPendingPongs()).to.include(txHash);
        blockchainData.removePendingPong(txHash);
        expect(blockchainData.getPendingPongs()).to.not.include(txHash);
        expect(fs.writeFileSync.calledTwice).to.be.true;
    });

    it('should add and remove queued pongs', function() {
        const txHash = '0x123';
        blockchainData.addQueuedPong(txHash);
        expect(blockchainData.getQueuedPongs()).to.include(txHash);
        blockchainData.removeQueuedPong(txHash);
        expect(blockchainData.getQueuedPongs()).to.not.include(txHash);
        expect(fs.writeFileSync.calledTwice).to.be.true;
    });

    it('should add and remove sent pongs', function() {
        const txHash = '0x123';
        blockchainData.addSentPong(txHash);
        expect(blockchainData.getSentPongs()).to.include(txHash);
        expect(blockchainData.isPongSent(txHash)).to.be.true;
        expect(fs.writeFileSync.calledOnce).to.be.true;
    });

    it('should queue and send pongs', function() {
        const txHash = '0x123';
        blockchainData.addPendingPong(txHash);
        blockchainData.queuePong(txHash);
        expect(blockchainData.getQueuedPongs()).to.include(txHash);
        blockchainData.sentPong(txHash);
        expect(blockchainData.getSentPongs()).to.include(txHash);
        expect(fs.writeFileSync.callCount).to.equal(3);
    });

    it('should unqueue pongs', function() {
        const txHash = '0x123';
        blockchainData.addQueuedPong(txHash);
        blockchainData.unqueuePong(txHash);
        expect(blockchainData.getPendingPongs()).to.include(txHash);
        expect(fs.writeFileSync.callCount).to.equal(2);
    });
});