const fs = require('fs');

class BlockchainData {
    constructor() {
        const data = this.loadData();
        this.started = data.started;
        this.blockNumber = data.blockNumber;
        this.lastNonce = data.lastNonce;
        this.pendingPongs = data.pendingPongs;
        this.queuedPongs = data.queuedPongs;
        this.sentPongs = data.sentPongs;
        this.state = data.state;
    }

    start() {
        this.started = true;
        this.saveData();
    }

    hasStarted() {
        return this.started;
    }

    saveData() {
        const data = {
            state: this.state,
            started: this.started,
            blockNumber: this.blockNumber,
            lastNonce: this.lastNonce,
            pendingPongs: this.pendingPongs,
            queuedPongs: this.queuedPongs, 
            sentPongs: this.sentPongs
        };
        fs.writeFileSync('data.json', JSON.stringify(data));
    }

    loadData() {
        const data = fs.readFileSync("data.json");
        return JSON.parse(data);
    }

    setState(state) {
        this.state = state;
        this.saveData();
    }

    getState() {
        return this.state;
    }

    // Obtener el último bloque añadido
    getLastAddedBlock() {
        return this.blockNumber;
    }

    // Establecer el último bloque añadido
    setLastAddedBlock(blockNumber) {
        this.blockNumber = blockNumber;
        this.saveData();
    }

    // Obtener el último nonce utilizado
    getLastUsedNonce() {
        return this.lastNonce;
    }

    // Actualizar el último nonce utilizado
    updateLastUsedNonce(nonce) {
        this.lastNonce = nonce;
        this.saveData();
    }


    addPendingPong(txHash) {
        if (!(this.isPongPending(txHash) || this.isPongProcessed(txHash))) {
            this.pendingPongs.push(txHash);
            this.saveData();
        } else {
            console.log("Tx Hash " + txHash + " already added");
        }
    }

    getPendingPongs() {
        return this.pendingPongs;
    }

    isPongPending(txHash) {
        return this.pendingPongs.indexOf(txHash) !== -1;
    }

    removePendingPong(txHash) {
        const index = this.pendingPongs.indexOf(txHash);
        if (index !== -1) {
            this.pendingPongs.splice(index, 1);
            this.saveData();
        }
    }

    firstPendingPong(txHash) {
        const pongs= this.getPendingPongs();
        return pongs[0];
    }

    addQueuedPong(txHash) { 
        if (!this.isPongQueued(txHash)) {
            this.queuedPongs.push(txHash);
            this.saveData();
        } else {
            console.log("Tx Hash " + txHash + " already queued");
        }
    }

    removeQueuedPong(txHash) {
        const index = this.queuedPongs.indexOf(txHash);
        if (index !== -1) {
            this.queuedPongs.splice(index, 1);
            this.saveData();
        }
    }

    isPongQueued(txHash) {
        return this.queuedPongs.indexOf(txHash) !== -1;
    }

    getQueuedPongs() {
        return this.queuedPongs;
    }

    addSentPong(txHash) {
        if (this.sentPongs.indexOf(txHash) === -1) {
            this.sentPongs.push(txHash);
            this.saveData();
        } else {
            console.log("Tx Hash " + txHash + " already sent");
        }
    }

    isPongSent(txHash) {
        return this.sentPongs.indexOf(txHash) !== -1;
    }

    getSentPongs() {
        return this.sentPongs;
    }

    isPongProcessed(txHash) {
        return this.isPongQueued(txHash) || this.isPongSent(txHash);
    }

    queuePong(txHash) {
        if(this.isPongPending(txHash) && !this.isPongProcessed(txHash)) {
            this.removePendingPong(txHash);
            this.addQueuedPong(txHash);
        } else {
            throw("Unconsistent queue");
        }
    }

    sentPong(txHash) {
        if(this.isPongQueued(txHash) && !this.isPongSent(txHash)) {
            this.removeQueuedPong(txHash);
            this.addSentPong(txHash);
        }
    }

    unqueuePong(txHash) {
        if(this.isPongQueued(txHash) && !this.isPongSent(txHash) && !this.isPongPending(txHash)) {
            this.removeQueuedPong(txHash);
            this.addPendingPong(txHash);
        } else {
            throw("unconsistent unqueue");
        }
    }
} 

module.exports = BlockchainData;