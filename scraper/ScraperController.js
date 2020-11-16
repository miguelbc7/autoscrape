const express = require("express");
const router = express.Router();
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
var axios = require("axios").default;
const tunnel = require('tunnel');
const request = require("request");
const cheerio = require("cheerio");

router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(bodyParser.json());
router.use(helmet());
router.use(cors());

var finalCount = 0;

router.post("/", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    req.setTimeout(6000000);

    const asin = req.body.asin || "";

    proxyGenerator().then( (proxy) => {
        if(asin.replace(/\s/g, "").indexOf(',') > -1) {
            console.log('asins');
            var asins = asin.replace(/\s/g, "").split(',');
            
            if(asin.length > 10) {
                return res.status(400).send({
                    status: 401,
                    message: 'error limit of asins',
                });
            }

            getAllVariantsMulti(asins, proxy).then( (dataVariants) => {
                console.log('dataVariants', dataVariants[0]);
                getReviewsPagesMulti(dataVariants[0], dataVariants[0].length, proxy).then( async(dataPages) => {
                    await getReviewsDataMulti(dataPages, proxy).then( async(dataReviews) => {
                        await organizeReviewsDataMulti(dataReviews).then( (data) => {
                            finalCount = 0;
                            
                            return res.status(200).send({
                                status: 201,
                                message: 'success',
                                data: data
                            });
                        }).catch( (error5) => {
                            console.log('error5', error5);
    
                            return res.status(400).send({
                                status: 400,
                                message: 'error',
                                error: error5
                            });
                        });
                    }).catch( (error4) => {
                        console.log('error4', error4);
    
                        return res.status(400).send({
                            status: 400,
                            message: 'error',
                            error: error4
                        });
                    });
                }).catch( (error3) => {
                    console.log('error3');
    
                    return res.status(400).send({
                        status: 400,
                        message: 'error',
                        error: error3
                    });
                });
            }).catch( (error) => {
                console.log('error', error);

                return res.status(401).send({
                    status: 401,
                    message: 'error',
                    data: error
                });
            });
        } else {
            console.log('asin');
            getAllVariants(asin, proxy).then( (dataVariants) => {
                console.log('dataVariants', dataVariants);
                getReviewsPages(dataVariants[0], dataVariants[1], proxy).then( async(dataPages) => {
                    await getReviewsData(dataPages, proxy).then( async(dataReviews) => {
                        await organizeReviewsData(dataReviews).then( (data) => {
                            finalCount = 0;
                            
                            return res.status(200).send({
                                status: 201,
                                message: 'success',
                                data: data
                            });
                        }).catch( (error5) => {
                            console.log('error5', error5);
    
                            return res.status(400).send({
                                status: 400,
                                message: 'error',
                                error: error5
                            });
                        });
                    }).catch( (error4) => {
                        console.log('error4', error4);
    
                        return res.status(400).send({
                            status: 400,
                            message: 'error',
                            error: error4
                        });
                    });
                }).catch( (error3) => {
                    console.log('error3', error3);
    
                    return res.status(400).send({
                        status: 400,
                        message: 'error',
                        error: error3
                    });
                });
            }).catch( (error2) => {
                console.log('error2', error2);
    
                return res.status(400).send({
                    status: 400,
                    message: 'error',
                    error: error2
                });
            });
        }
    }).catch( (error1) => {
        console.log('error1', error1);

        return res.status(400).send({
            status: 400,
            message: 'error',
            error: error1
        });
    });
});

datediff = (first, second) => {
    return Math.round((first - second) / (1000*60*60*24));
}

getAllVariants = (asin, proxy) => {
    console.log('getAllVariants');

    return new Promise( (resolve, reject) => {
        var headers = { 
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }
        let data = [], k = 0;
        var url = "https://www.amazon.com/dp/" + asin;

        const agent = tunnel.httpsOverHttp({
            proxy: {
              host: proxy[0],
              port: proxy[1]
            }
        });

        const responsePromise = axios.request({
            url: url,
            method: 'get',
            headers: headers,
            agent,
            port: 443,
        });

        responsePromise.then( (response) => {
            let $ = cheerio.load(response.data);
                
            $('.averageStarRatingNumerical').each( (i, d) => {
                var c = $(d).text().trim();
                finalCount = c.split(' global ratings')[0];
                finalCount = finalCount.split(',').join('');
            });

            if($('#variation_color_name').text().trim()) {
                console.log('inside 1');
                $('#variation_color_name').each((i, e) => {
                    $('.a-unordered-list', e).each( (i2, e2) => {
                        $('li', e2).each((i3, e3) => {
                            var length = $('li', e2).length;
                            var url = $(e3).attr('data-dp-url');
    
                            if(url) {
                                var preasin = url.split('/ref=twister_')[0];
                                var asin = preasin.split('dp/')[1];
                            } else {
                                var asin = $(e3).attr('data-defaultasin');
                            }
    
                            var precolor = $(e3).attr('title');
                            var color = precolor.split('Click to select ')[1];
                            data.push({ asin: asin, style: color });
                            k++;
    
                            if(length == k) {
                                var count1 = $('#askATFLink').text().trim();
                                var count2 = count1.split(" answered ")[0];
                                
                                if(count2.indexOf(',') > -1) {
                                    var count = count2.split(',').join('');
                                } else {
                                    var count = count2;
                                }
    
                                resolve([data, k]);
                            }
                        });
                    });
                });
            } else if($('#variation_style_name').text().trim()) {
                console.log('inside 2');
                $('#variation_style_name').each((i, e) => {
                    $('.a-unordered-list', e).each( (i2, e2) => {
                        $('li', e2).each((i3, e3) => {
                            var length = $('li', e2).length;
                            var url = $(e3).attr('data-dp-url');
    
                            if(url) {
                                var preasin = url.split('/ref=twister_')[0];
                                var asin = preasin.split('dp/')[1];
                            } else {
                                var asin = $(e3).attr('data-defaultasin');
                            }
    
                            var precolor = $(e3).attr('title');
                            var color = precolor.split('Click to select ')[1];
                            data.push({ asin: asin, style: color });
                            k++;
    
                            if(length == k) {
                                var count1 = $('#askATFLink').text().trim();
                                var count2 = count1.split(" answered ")[0];
                                
                                if(count2.indexOf(',') > -1) {
                                    var count = count2.split(',').join('');
                                } else {
                                    var count = count2;
                                }
    
                                resolve([data, k]);
                            }
                        });
                    });
                });
            } else {
                console.log('inside 3');
                data.push({ asin: asin, style: '' });
                resolve([data, 1]);
            }
        }).catch( (error) => {
            reject (error);
        });
    });
}

getAllVariantsMulti = (asins, proxy) => {
    console.log('getAllVariantsMulti');

    return new Promise( async(resolve, reject) => {
        let dt = [];
        let l = 0;

        await asins.forEach( async(asin) => {
            var headers = { 
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
            let data = [], k = 0;
            var url = "https://www.amazon.com/dp/" + asin;
            /* let k = 0; */

            const agent = tunnel.httpsOverHttp({
                proxy: {
                host: proxy[0],
                port: proxy[1]
                }
            });

            const responsePromise = axios.request({
                url: url,
                method: 'get',
                headers: headers,
                agent,
                port: 443,
            });

            responsePromise.then( (response) => {
                let $ = cheerio.load(response.data);
                    
                $('.averageStarRatingNumerical').each( (i, d) => {
                    var c = $(d).text().trim();
                    finalCount = c.split(' global ratings')[0];
                    finalCount = finalCount.split(',').join('');
                });

                if($('#variation_color_name').text().trim()) {
                    console.log('inside 1');
                    $('#variation_color_name').each((i, e) => {
                        $('.a-unordered-list', e).each( (i2, e2) => {
                            $('li', e2).each((i3, e3) => {
                                var length = $('li', e2).length;
                                var url = $(e3).attr('data-dp-url');
        
                                if(url) {
                                    var preasin = url.split('/ref=twister_')[0];
                                    var asin = preasin.split('dp/')[1];
                                } else {
                                    var asin = $(e3).attr('data-defaultasin');
                                }
        
                                var precolor = $(e3).attr('title');
                                var color = precolor.split('Click to select ')[1];
                                data.push({ asin: asin, style: color });
                                k++;

                                if(length == k) {
                                    var count1 = $('#askATFLink').text().trim();
                                    var count2 = count1.split(" answered ")[0];
                                    dt.push(data);
                                    l++;

                                   /*  if(count2.indexOf(',') > -1) {
                                        var count = count2.split(',').join('');
                                    } else {
                                        var count = count2;
                                    } */

                                    if(l == asins.length) {
                                        resolve([dt, k]);
                                    }
                                }
                            });
                        });
                    });
                } else if($('#variation_style_name').text().trim()) {
                    console.log('inside 2');
                    $('#variation_style_name').each((i, e) => {
                        $('.a-unordered-list', e).each( (i2, e2) => {
                            $('li', e2).each((i3, e3) => {
                                var length = $('li', e2).length;
                                var url = $(e3).attr('data-dp-url');
        
                                if(url) {
                                    var preasin = url.split('/ref=twister_')[0];
                                    var asin = preasin.split('dp/')[1];
                                } else {
                                    var asin = $(e3).attr('data-defaultasin');
                                }
        
                                var precolor = $(e3).attr('title');
                                var color = precolor.split('Click to select ')[1];
                                data.push({ asin: asin, style: color });
                                k++;

                                if(length == k) {
                                    var count1 = $('#askATFLink').text().trim();
                                    var count2 = count1.split(" answered ")[0];
                                    dt.push(data);
                                    l++;

                                    /* if(count2.indexOf(',') > -1) {
                                        var count = count2.split(',').join('');
                                    } else {
                                        var count = count2;
                                    } */
                                    
                                    if(l == asins.length) {
                                        resolve([dt, k]);
                                    }
                                    
                                }
                            });
                        });
                    });
                } else {
                    console.log('inside 3');
                    data.push({ asin: asin, style: '' });
                    dt.push(data);
                    /* k++; */
                    l++;

                    if(l == asins.length) {
                        resolve([dt, 1]);
                    }
                }
            }).catch( (error) => {
                reject (error);
            });
        });
    });
}

getReviewsPages = (variants, length, proxy) => {
    console.log('getReviewsPages');
    
    return new Promise( (resolve, reject) => {
        /* let headers = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36' } */
        var headers = { 
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }
        let data = [];
        let cont = 0;

        const agent = tunnel.httpsOverHttp({
            proxy: {
              host: proxy[0],
              port: proxy[1]
            }
        });

        variants.forEach( async(row, index) => {
            let url = "https://www.amazon.com/product-reviews/" + row.asin + "/ref=cm_cr_arp_d_viewopt_fmt?ie=UTF8&reviewerType=all_reviews&formatType=current_format&pageNumber=1"

            const responsePromise = axios.request({
                url: url,
                method: 'get',
                headers: headers,
                agent,
                port: 443,
            });

            await responsePromise.then( (response) => {
                let $ = cheerio.load(response.data);
                let pos = 0;

                $('#filter-info-section').each((i, d) => {
                    $('.a-spacing-base', d).each((i, d1) => {
                        if(pos == 0) {
                            let text = $(d1).text().trim();

                            if(text.indexOf(' of ') > -1) {
                                let finalText = (text.split(' of ')[1]).split(' reviews')[0], textSplit, count;
        
                                if(finalText.indexOf(',') > -1) {
                                    textSplit = finalText.split(',').join('');
                                } else if(finalText.indexOf('.') > -1) {
                                    textSplit = finalText.split('.').join('');
                                }
                                
                                count = textSplit / 10;
                                
                                if(parseInt(textSplit) > 0) {
                                    if(count < 1) {
                                        count = 1;
                                    } else {
                                        count = Math.ceil(count);
                                    }
                                } else {
                                    count = 0;
                                }
        
                                let inf = { asin: row.asin, style: row.style, pages: count, total: textSplit };
                                data.push(inf);
                            } else if(text.indexOf(' global ratings') > -1) {
                                let finalText = (text.split(' global review')[0]).split(' | ')[1], textSplit, count;

                                if(finalText.indexOf(',') > -1) {
                                    textSplit = finalText.split(',').join('');
                                } else if(finalText.indexOf('.') > -1) {
                                    textSplit = finalText.split('.').join('');
                                } else {
                                    textSplit = finalText;
                                }

                                count = textSplit / 10;
        
                                if(parseInt(textSplit) > 0) {
                                    if(count < 1) {
                                        count = 0;
                                    } else {
                                        count = Math.ceil(count);
                                    }
                                } else {
                                    count = 0;
                                }
        

                                let inf = { asin: row.asin, style: row.style, pages: count, total: textSplit };
                                data.push(inf);
                            }
        
                            pos++;
                            cont++;

                            if(cont == length) {
                                resolve(data);
                            }
                        }
                    });
                });
            }).catch((error) => {
                console.log('error');
                reject(error);
            });
        });
    });
}

getReviewsPagesMulti = (prevariants, length, proxy) => {
    console.log('getReviewsPagesMulti');
    
    return new Promise( async(resolve, reject) => {
        let headers = { 
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }
        /* let headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36" }; */

        const agent = tunnel.httpsOverHttp({
            proxy: {
              host: proxy[0],
              port: proxy[1]
            }
        });

        var dt = [];
        var ccc = 0;
        
        await prevariants.forEach( async(variants) => {
            console.log('variants', variants);
            let data = [];
            let cont = 0;

            await variants.forEach( async(row, index) => {
                console.log('row', row);
                let url = "https://www.amazon.com/product-reviews/" + row.asin + "/ref=cm_cr_arp_d_viewopt_fmt?ie=UTF8&reviewerType=all_reviews&formatType=current_format&pageNumber=1"

                const responsePromise = axios.request({
                    url: url,
                    method: 'get',
                    headers,
                    agent,
                    port: 443,
                });

                await responsePromise.then( (response) => {
                    let $ = cheerio.load(response.data);
                    let pos = 0;

                    $('#filter-info-section').each((i, d) => {
                        console.log('yes 1')
                        $('.a-spacing-base', d).each((i, d1) => {
                            if(pos == 0) {
                                let text = $(d1).text().trim();

                                if(text.indexOf(' of ') > -1) {
                                    let finalText = (text.split(' of ')[1]).split(' reviews')[0], textSplit, count;
            
                                    if(finalText.indexOf(',') > -1) {
                                        textSplit = finalText.split(',').join('');
                                    } else if(finalText.indexOf('.') > -1) {
                                        textSplit = finalText.split('.').join('');
                                    }
                                    
                                    count = textSplit / 10;
                                    
                                    if(parseInt(textSplit) > 0) {
                                        if(count < 1) {
                                            count = 0;
                                        } else {
                                            count = Math.ceil(count);
                                        }
                                    } else {
                                        count = 0;
                                    }
            
                                    if(row.style) {
                                        var inf = { asin: row.asin, style: row.style, pages: count, total: textSplit };
                                    } else {
                                        var inf = { asin: row.asin, style: '', pages: count, total: textSplit };
                                    }
                                    data.push(inf);
                                } else if(text.indexOf(' global ratings') > -1) {
                                    let finalText = (text.split(' global review')[0]).split(' | ')[1], textSplit, count;

                                    if(finalText.indexOf(',') > -1) {
                                        textSplit = finalText.split(',').join('');
                                    } else if(finalText.indexOf('.') > -1) {
                                        textSplit = finalText.split('.').join('');
                                    } else {
                                        textSplit = finalText;
                                    }

                                    count = textSplit / 10;
            
                                    if(parseInt(textSplit) > 0) {
                                        if(count < 1) {
                                            count = 1;
                                        } else {
                                            count = Math.ceil(count);
                                        }
                                    } else {
                                        count = 0;
                                    }

                                    if(row.style) {
                                        var inf = { asin: row.asin, style: row.style, pages: count, total: textSplit };
                                    } else {
                                        var inf = { asin: row.asin, style: '', pages: count, total: textSplit };
                                    }
                                    data.push(inf);
                                }
            
                                pos++;
                                cont++;

                                console.log('cont', cont);
                                console.log('cont length', length);

                                if(cont == variants.length) {
                                    dt.push(data);
                                    ccc++;

                                    console.log('ccc', ccc);
                                    console.log('prevariants.length', prevariants.length);

                                    if(ccc == prevariants.length) {
                                        console.log('inside finish');
                                        resolve(dt);
                                    }
                                }
                            }
                        });
                    });
                }).catch((error) => {
                    console.log('error');
                    reject(error);
                });
            });
        });
    });
}

getReviewsData = async(pagesData,proxy) => {
    console.log('getReviewsData');

    return await new Promise( async(resolve, reject) => {
        /* let headers = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36' } */
        let headers = { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        };
        let data = [];
        let cont = 0;

        const agent = tunnel.httpsOverHttp({
            proxy: {
              host: proxy[0],
              port: proxy[1]
            }
        });

        console.log('length',  Object.keys(pagesData).length)
        for (let h = 0; h < Object.keys(pagesData).length; h++) {
            if(pagesData[h].pages > 0) {
                var ctt = 0;
                var dat = [];

                for (let ct = 0; ct <= pagesData[h].pages; ct++) {
                    let url = "https://www.amazon.com/product-reviews/" + pagesData[h].asin + "/ref=cm_cr_arp_d_viewopt_fmt?ie=UTF8&reviewerType=all_reviews&formatType=current_format&pageNumber=" + (ct + 1);
                    const responsePromise = axios.request({
                        url: url,
                        method: 'get',
                        headers: headers,
                        agent,
                        port: 443,
                    });
                    
                    await responsePromise.then( async(response) => {
                        let $ = cheerio.load(response.data);
                        let qua, date;

                        var elements = $(response.data);
                        var found = await $('.review-date', elements);
                        var length = found.length;
                        var i = 0;
                        dat[i] = [{ value: '', date: '' }];

                        found.each( (index, elem) => {
                            date = $(elem).text().trim();
                            
                            if(date.indexOf(' on ') > -1) {
                                date = date.split(' on ')[1];
                                dat.push(date);
                            }
                            
                            i++;

                            if(i == found.length) {
                                console.log('ct', ct);
                                console.log('pages', pagesData[h].pages);

                                if(ct == pagesData[h].pages) {
                                    console.log('dat', dat);
                                                                
                                    data.push({ asin: pagesData[h].asin, style: pagesData[h].style, reviews: dat });
                                    cont++;
                                }
                            }
                        });
                    }).catch( (error) => {
                        reject(error);
                    });
                }
            } else {
                data.push({ asin: pagesData[h].asin, style: pagesData[h].style, reviews: [] });
                cont++;
            }
        }

        console.log('cont', cont);
        console.log('length', Object.keys(pagesData).length);

        if (cont == Object.keys(pagesData).length) {
            console.log('resolve');
            resolve(data);
        }
    });
}

getReviewsDataMulti = async(prePagesData,proxy) => {
    console.log('getReviewsDataMulti');

    return await new Promise( async(resolve, reject) => {
        /* let headers = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36' } */
        let headers = { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        };

        const agent = tunnel.httpsOverHttp({
            proxy: {
              host: proxy[0],
              port: proxy[1]
            }
        });

        let ccc = 0;
        let dt = [];

        await prePagesData.forEach( async(pagesData) => {
            let data = [];
            let cont = 0;

            for (let h = 0; h < Object.keys(pagesData).length; h++) {
                if(pagesData[h].pages > 0) {
                    var ctt = 0;
                    var dat = [];
    
                    for (let ct = 0; ct <= pagesData[h].pages; ct++) {
                        let url = "https://www.amazon.com/product-reviews/" + pagesData[h].asin + "/ref=cm_cr_arp_d_viewopt_fmt?ie=UTF8&reviewerType=all_reviews&formatType=current_format&pageNumber=" + (ct + 1);
    
                        const responsePromise = axios.request({
                            url: url,
                            method: 'get',
                            headers: headers,
                            agent,
                            port: 443,
                        });
                        
                        await responsePromise.then( async(response) => {
                            let $ = cheerio.load(response.data);
                            let qua, date;
    
                            var elements = $(response.data);
                            var found = await $('.review-date', elements);
                            var length = found.length;
                            var i = 0;
                            dat[i] = [{ value: '', date: '' }];
    
                            found.each( (index, elem) => {
                                date = $(elem).text().trim();
                                
                                if(date.indexOf(' on ') > -1) {
                                    date = date.split(' on ')[1];
                                    dat.push(date);
                                }
                                
                                i++;
    
                                if(i == found.length) {
                                    console.log('ct', ct);
                                    console.log('pages', pagesData[h].pages);
    
                                    if(ct == pagesData[h].pages) {
                                        console.log('dat', dat);
                                                                    
                                        data.push({ asin: pagesData[h].asin, style: pagesData[h].style, reviews: dat });
                                        cont++;
                                    }
                                }
                            });
                        }).catch( (error) => {
                            reject(error);
                        });
                    }
                } else {
                    data.push({ asin: pagesData[h].asin, style: pagesData[h].style, reviews: [] });
                    cont++;
                }
            }

            console.log('cont', cont);
            console.log('length', Object.keys(pagesData).length);

            if (cont == Object.keys(pagesData).length) {
                console.log('resolve');
                dt.push(data);
                ccc++;

                if(ccc == prePagesData.length) {
                    resolve(dt);
                }
            }
        });
    });
}

organizeReviewsData = (reviewsData) => {
    console.log('organizeReviewsData');
    return new Promise( async(resolve, reject) => {
        let data = [];
        let cont = 0;

        await reviewsData.forEach( async(row2, index) => {
            let reviews = row2.reviews;
            if(Object.keys(reviews).length > 0) {
                let reviewsCount = [];
                let reviewsCount30 = [];
                let reviewsCount60 = [];
                let reviewsCount90 = [];
                let reviewsMedia = 0;
                let i = 0;

                try {
                    await Object.keys(reviews).forEach( (row, index) => { 
                        let reviewDate = new Date(reviews[index]);
                        let date = new Date();
                        let difference = datediff(date, reviewDate);
                        
                        reviewsCount.push('total');

                        if(difference < 31) {
                            reviewsCount30.push('30');
                        } else if(difference < 61) {
                            reviewsCount60.push('60');
                        } else {
                            reviewsCount90.push('90');
                        }

                        i++;

                        if(Object.keys(reviews).length == i) {
                            media1 = reviewsCount.length / finalCount;
                            reviewsMedia = media1 * 100;

                            let info = {
                                reviewsCount: reviewsCount.length,
                                reviewsCount30: reviewsCount30.length,
                                reviewsCount60: reviewsCount30.length + reviewsCount60.length,
                                reviewsCount90: reviewsCount30.length + reviewsCount60.length + reviewsCount90.length,
                                reviewsMedia: reviewsMedia,
                            };

                            data.push({ asin: row2.asin, style: row2.style, data: info });
                            cont++;

                            if(cont == Object.keys(reviewsData).length) {
                                resolve(data);
                            }
                        }
                    });
                } catch (error) {
                    console.log('error', error);
                    reject(error);
                }
            } else {
                try {
                    let info = {
                        reviewsCount: 0,
                        reviewsCount30: 0,
                        reviewsCount60: 0,
                        reviewsCount90: 0,
                        reviewsMedia: 0,
                    };
                
                    data.push({ asin: row2.asin, style: row2.style, data: info });
                    cont++;

                    if(cont == Object.keys(reviewsData).length) {
                        resolve(data);
                    }
                } catch (error) {
                    console.log('error', error);
                     reject(error);
                }
            }
        });
    });
};

organizeReviewsDataMulti = (preReviewsData) => {
    console.log('organizeReviewsDataMulti');

    return new Promise( async(resolve, reject) => {
        let ccc = 0;
        let dt = [];

        await preReviewsData.forEach( async(reviewsData) => {
            let data = [];
            let cont = 0;

            await reviewsData.forEach( async(row2, index) => {
                let reviews = row2.reviews;
                if(Object.keys(reviews).length > 0) {
                    let reviewsCount = [];
                    let reviewsCount30 = [];
                    let reviewsCount60 = [];
                    let reviewsCount90 = [];
                    let reviewsMedia = 0;
                    let i = 0;
    
                    try {
                        await Object.keys(reviews).forEach( (row, index) => { 
                            let reviewDate = new Date(reviews[index]);
                            let date = new Date();
                            let difference = datediff(date, reviewDate);
                            
                            reviewsCount.push('total');
    
                            if(difference < 31) {
                                reviewsCount30.push('30');
                            } else if(difference < 61) {
                                reviewsCount60.push('60');
                            } else {
                                reviewsCount90.push('90');
                            }
    
                            i++;
    
                            if(Object.keys(reviews).length == i) {
                                media1 = reviewsCount.length / finalCount;
                                reviewsMedia = media1 * 100;
    
                                let info = {
                                    reviewsCount: reviewsCount.length,
                                    reviewsCount30: reviewsCount30.length,
                                    reviewsCount60: reviewsCount30.length + reviewsCount60.length,
                                    reviewsCount90: reviewsCount30.length + reviewsCount60.length + reviewsCount90.length,
                                    reviewsMedia: reviewsMedia,
                                };
    
                                data.push({ asin: row2.asin, style: row2.style, data: info });
                                cont++;
    
                                if(cont == Object.keys(reviewsData).length) {
                                    dt.push(data);
                                    ccc++;

                                    if(ccc = preReviewsData.length) {
                                        resolve(dt);
                                    }
                                }
                            }
                        });
                    } catch (error) {
                        console.log('error', error);
                        reject(error);
                    }
                } else {
                    try {
                        let info = {
                            reviewsCount: 0,
                            reviewsCount30: 0,
                            reviewsCount60: 0,
                            reviewsCount90: 0,
                            reviewsMedia: 0,
                        };
                    
                        data.push({ asin: row2.asin, style: row2.style, data: info });
                        cont++;
    
                        if(cont == Object.keys(reviewsData).length) {
                            resolve(data);
                        }
                    } catch (error) {
                        console.log('error', error);
                         reject(error);
                    }
                }
            });
        });
    });
};

proxyGenerator = () => {
    return new Promise( async(resolve, reject) => {
        let ip_addresses = [];
        let port_numbers = [];
    
        request("https://sslproxies.org/", function(error, response, html) {
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(html);
    
                $("td:nth-child(1)").each(function(index, value) {
                    ip_addresses[index] = $(this).text();
                });
    
                $("td:nth-child(2)").each(function(index, value) {
                    port_numbers[index] = $(this).text();
                });
            } else {
                console.log("Error loading proxy, please try again");
                reject("Error loading proxy, please try again")
            }
    
            ip_addresses.join(", ");
            port_numbers.join(", ");

            let random_number = Math.floor(Math.random() * 100);
            let proxy = 'http://' + ip_addresses[random_number] + ':' + port_numbers[random_number];
            /* let proxy = 'http://' + ip_addresses[random_number] + ':5005'; */

            resolve([ip_addresses[random_number], port_numbers[random_number]]);
        });
    });
}

module.exports = router;