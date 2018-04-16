let paymentService = (() => {
    function loadTeams() {
        // Request teams from db
        return requester.get('appdata', 'teams', 'kinvey');
    }

    function loadTeamDetails(teamId) {
        return requester.get('appdata', 'teams/' + teamId, 'kinvey');
    }

    function edit(teamId, name, description) {
        let teamData = {
            name: name,
            comment: description,
            author: sessionStorage.getItem('username')
        };

        return requester.update('appdata', 'teams/' + teamId, 'kinvey', teamData);
    }

    function getActiveReceipt() {
        let userId = sessionStorage.getItem('userId')
        
        return requester.get('appdata', `receipts?query={"_acl.creator":"${userId}","active":"true"}`, 'kinvey');
    }

    function getEntriesByReceiptId(receiptId) {
        
        return requester.get('appdata', `entries?query={"receiptId":"${receiptId}"}`, 'kinvey');
    }

    function getMyReceipts() {
        let userId = sessionStorage.getItem('userId')
        return requester.get('appdata', `receipts?query={"_acl.creator":"${userId}","active":"false"}`, 'kinvey');
    }

    function getReceiptDetails(receiptId) {
        
        return requester.get('appdata', `receipts/${receiptId}`, 'kinvey');
    }

    function createEntry(type, qty, price, receiptId) {
        let entryData = {
            type,
            qty,
            price,
            receiptId
        };

        return requester.post('appdata', 'entries', 'kinvey', entryData);
    }

    function deleteEntry(entryId) {
        return requester.remove('appdata', `entries/${entryId}`, 'kinvey')
    }

    function createReceipt (productCount,total){
        let receiptData = {
            active : true,
            productCount: productCount,
            total: total
        };

        return requester.post('appdata', 'receipts', 'kinvey', receiptData);
    }

    function commitReceipt(receiptId, productCount,total) {
        let receiptData = {
            active: false,
            productCount,
            total,
          }

        return requester.update('appdata', 'receipts/' + receiptId, 'kinvey', receiptData)
    }


    return {
        createEntry,
        createReceipt,
        getActiveReceipt,
        getEntriesByReceiptId,
        getMyReceipts,
        commitReceipt,
        getReceiptDetails,
        deleteEntry
    }
})()