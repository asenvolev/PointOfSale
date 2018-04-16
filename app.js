$(() => {
    const app = Sammy('#container', function () {
        this.use('Handlebars', 'hbs')

        //authorizations
        this.get('index.html', (ctx)=>{
            if (auth.isAuth()) {
                ctx.redirect('index.html#/home')
            }
            else{
                ctx.redirect('index.html#/welcome')
            }
        })
        
        this.get('#/welcome', (ctx)=>{
            ctx.loggedIn = auth.isAuth()
            ctx.username = sessionStorage.getItem('username')
            ctx.loadPartials({
                header : './templates/common/header.hbs',
                footer : './templates/common/footer.hbs',
                loginForm : './templates/welcome/loginForm.hbs',
                registerForm : './templates/welcome/registerForm.hbs',
            }).then(function () {
                this.partial('./templates/welcome/welcome.hbs')
            })
        })


        this.get('#/logout', (ctx)=>{
            auth.logout().then(function () {
                sessionStorage.clear()
                ctx.redirect('index.html#/welcome');
            })
        })

        this.post('#/register', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let repeatPassword = ctx.params.passwordcheck;

            if (password !== repeatPassword || username.length <5 || password.length == 0) {
                alert('Passwords do not match or username is less than 5 characters or there is no password typed in.');
            } else {
                auth.register(username, password)
                    .then((userData) => {
                        auth.saveSession(userData);
                        auth.showInfo('User registration successful.')
                        ctx.redirect('index.html#/home');
                    })
            }
        });

        this.post('#/login', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;

            auth.login(username, password)
                .then((userData) => {
                    auth.saveSession(userData);
                    ctx.redirect('index.html#/home');
                    auth.showInfo("Login successfull")
                })
                .catch(console.error);
        });

        this.get('#/home', (ctx)=>{
            ctx.loggedIn = auth.isAuth()
            ctx.username = sessionStorage.getItem('username')
            paymentService.getActiveReceipt().then(function (receipt) {
                console.log(receipt)
                if (receipt[0]) {
                    console.log('there is receipt')
                    let receiptId = receipt[0]._id
                    paymentService.getEntriesByReceiptId(receiptId).then(function (entries) {
                        ctx.entries = entries
                        console.log(entries)
                        let total = 0
                        if (entries[0]) {
                            console.log(entries[0].price)
                            console.log(entries[0].qty)
                            for (let entry of entries) {
                                total += entry.price * entry.qty
                            }
                        }
                        console.log(total)
                        ctx.total = total
                        ctx.loadPartials({
                            header : './templates/common/header.hbs',
                            footer : './templates/common/footer.hbs',
                            entry : './templates/home/entry.hbs',
                            createEntryForm : './templates/home/createEntryForm.hbs',
                            createReceiptForm : './templates/home/createReceiptForm.hbs',
                        }).then(function () {
                            this.partial('./templates/home/home.hbs')
                        })
                    })
                }
                else{
                    console.log('there is NOT receipt')
                    
                    paymentService.createReceipt(0,0).then(function (receipt) {
                        ctx.total = receipt.total
                        ctx.loadPartials({
                            header : './templates/common/header.hbs',
                            footer : './templates/common/footer.hbs',
                            createEntryForm : './templates/home/createEntryForm.hbs',
                            createReceiptForm : './templates/home/createReceiptForm.hbs',
                        }).then(function () {
                            this.partial('./templates/home/home.hbs')
                        })
                    })
                }
            })
            
        })

        this.post('#/createEntry', (ctx)=>{
            let type = ctx.params.type
            let qty = ctx.params.qty
            let price = ctx.params.price

            paymentService.getActiveReceipt().then(function (receipt) {
                let receiptId = receipt[0]._id
                paymentService.createEntry(type,qty,price,receiptId).then(function () {
                    ctx.redirect('index.html#/home')
                    auth.showInfo('Entry added')
                })
            })
        })

        this.get('#/delete/:id', (ctx)=>{
            let entryId = ctx.params.id.substr(1);

            paymentService.deleteEntry(entryId).then(function () {
                ctx.redirect('index.html#/home')
                auth.showInfo('Entry removed')
            })
        })

        this.post('#/createReceipt', (ctx)=>{
            paymentService.getActiveReceipt().then(function (receipt) {
                let receiptId = receipt[0]._id
                paymentService.getEntriesByReceiptId(receiptId).then(function (entries) {
                    let productCount = entries.length
                    let total = 0
                    if (entries[0]) {
                        for (let entry of entries) {
                            total += (+entry.price) * (+entry.qty)
                        }
                    }
                    paymentService.commitReceipt(receiptId,productCount,total).then(function () {
                        ctx.redirect('index.html#/home')
                    })
                })
            })
        })

        this.get('#/overview', (ctx)=>{
            ctx.loggedIn = auth.isAuth()
            ctx.username = sessionStorage.getItem('username')
            paymentService.getMyReceipts().then(function (receipts) {
                ctx.receipts = receipts
                console.log(receipts)
                ctx.loadPartials({
                    header : './templates/common/header.hbs',
                    footer : './templates/common/footer.hbs',
                    receipt : './templates/receipts/receipt.hbs'
                }).then(function () {
                    this.partial('./templates/receipts/archive.hbs')
                })
            })
        })

        this.get('#/details/:id', (ctx)=>{
            let receiptId = ctx.params.id.substr(1);
            ctx.loggedIn = auth.isAuth()
            ctx.username = sessionStorage.getItem('username')
            paymentService.getReceiptDetails(receiptId).then(function (receipt) {
                
                paymentService.getEntriesByReceiptId(receiptId).then(function (products) {
                    for (let product of products) {
                        product.totalPrice = product.qty * product.price
                    }
                    ctx.products = products
                    ctx.loadPartials({
                        header : './templates/common/header.hbs',
                        footer : './templates/common/footer.hbs',
                        product : './templates/receipts/product.hbs'
                    }).then(function () {
                        this.partial('./templates/receipts/details.hbs')
                    })
                })
                
            })
        })

    }).run()
})