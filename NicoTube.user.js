// ==UserScript==
// @name            NicoTube
// @namespace       NicoTube
// @version         0.0.2
// @description     Youtubeのライブチャットをniconicoの様に描画します
// @author          @nagataaaas
// @name:en         NicoTube
// @description:en  Render Youtube live chat on the video just like niconico
// @match           https://www.youtube.com/watch*
// @require         https://code.jquery.com/jquery-3.3.1.min.js
// @grant           none
// @grant           GM_setValue
// @grant           GM_getValue
// @noframes
/* globals jQuery, $ */
// ==/UserScript==

(function(){
    // comment icon by Freepik(http://www.freepik.com/) from www.flaticon.com
    let availableIcon = `<path d="m0 0v342h120.148438v112.054688l181.253906-112.054688h210.597656v-342zm360.996094 214.335938h-209.992188v-30h209.988282v30zm0-65.175782h-209.992188v-30h209.988282v30zm0 0" fill="white" id="nicotubepath1"/>`
    let unavailableIcon = `<path d="m0 0v342h120.148438v112.054688l181.253906-112.054688h210.597656v-342zm482 312h-189.121094l-142.730468 88.238281v-88.238281h-120.148438v-282h452zm0 0" fill="white" id="nicotubepath2" style="visibility:hidden;"/><path d="m151.003906 121.160156h209.988282v30h-209.988282zm0 0" fill="white" id="nicotubepath3" style="visibility:hidden;"/><path d="m151.003906 183h209.988282v30h-209.988282zm0 0" fill="white" id="nicotubepath4" style="visibility:hidden;"/>`
    let commentToggleButton = `<button class="ytp-button" aria-label="NicoTibe" title="NicoTibe" show="true" id="nicotubeswitch"><svg height="100%" viewBox="-128 -157 768 768" width="100%">${availableIcon}${unavailableIcon}</svg></button>`

    Object.defineProperty(String.prototype, 'hashCode', {
        value: function() {
            var hash = 0, i, chr;
            for (i = 0; i < this.length; i++) {
                chr = this.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }
    });

    const getVars = () => {
        let userConfig = {
            commentSpeed: 5, // from appear to disappear
            fontFamily: 'Arial', // font of chat
            isBold: true, // is comment font bold
            fontSize: 0.06, // Relative size to height of video
            commentMargin: 0.4, // Relative size to fontSize
            fontColor: '#FFFFFF', // color of comment (default to white
            canvasAlpha: 0.5, // alpha of comment
            borderWidth: 0.1, // Relative size to fontSize
            borderColor: '#000000', // color of border (default to black
        };
        return userConfig;
    };

    const getChatField = () => {return window.frames.chatframe && window.frames.chatframe.contentDocument.querySelector('#items.style-scope.yt-live-chat-item-list-renderer')}
    const getPlayer = () => {return document.getElementById('movie_player')}

    let waitInterval;
    const waitReady = () => {
        let findCount = 1;
        clearInterval(waitInterval);
        waitInterval = setInterval(() => {
            findCount++;
            if(findCount > 180){
                clearInterval(waitInterval);
                findCount = 0;
            }
            if(getPlayer() && getChatField()){
                clearInterval(waitInterval);
                nicoChat();

                findCount = 0;
            }
        }, 1000);
    }

    $(document).ready(() => {
        waitReady();
    })

    function nicoChat() {
        'use strict';
        // setting
        let config = getVars();
        let player = getPlayer();
        let chatField = getChatField()
        let commentCanvas = 'nicoChatCanvas'; // id of canvas
        let toolBarRight = $('#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-right-controls').get(0);
        let canvasHtml = `<canvas id='${commentCanvas}' style='pointer-events: none; z-index:2000'; width='${player.getBoundingClientRect().width}px'; height='${player.getBoundingClientRect().height}px'; position='absolute'></div>`;
        let nicoTubeOn = true;
        let resized = false;

        player.insertAdjacentHTML('afterbegin', canvasHtml);
        toolBarRight.insertAdjacentHTML('afterbegin', commentToggleButton)
        let nicoTubeSwitch = $('#nicotubeswitch');
        commentCanvas = document.getElementById(commentCanvas);
        let video = document.querySelector('#movie_player > div.html5-video-container > video');
        player.style.position = 'relative';
        commentCanvas.style.position = 'absolute';
        video.style.position = 'absolute';
        let ctx = commentCanvas.getContext('2d');

        let currentPlayState = 1;

        // on off switch
        nicoTubeSwitch.get(0).onclick = () => {
            let currentSwitch = eval(nicoTubeSwitch.attr('show'));
            nicoTubeSwitch.attr('show', !currentSwitch)
            $('#nicotubepath1').css('visibility', (currentSwitch? 'hidden': 'visible'));
            $('#nicotubepath2').css('visibility', (!currentSwitch? 'hidden': 'visible'));
            $('#nicotubepath3').css('visibility', (!currentSwitch? 'hidden': 'visible'));
            $('#nicotubepath4').css('visibility', (!currentSwitch? 'hidden': 'visible'));
            nicoTubeOn = !currentSwitch;
            $(commentCanvas).css('visibility', (nicoTubeOn? 'visible': 'hidden'));
        }

        // switch mouseover mouseout
        let isMouseOn = false;
        let hoverMutation;

        const hoverObserver = new MutationObserver((mutations) => {
            $('#movie_player > div.ytp-tooltip.ytp-bottom').css('display', '')
            $('#movie_player > div.ytp-tooltip.ytp-bottom').css('opacity', '1.0')
        });

        let hoverObserveConfig = { attributes: true, childList: false, characterData: false };

        nicoTubeSwitch.get(0).onmouseover = () => {
            isMouseOn = true;
            hoverObserver.observe($('#movie_player > div.ytp-tooltip.ytp-bottom').get(0), hoverObserveConfig);
            $('#movie_player > div.ytp-tooltip.ytp-bottom').css('display', '')
            $('#movie_player > div.ytp-tooltip.ytp-bottom').css('left', nicoTubeSwitch.offset().left + 'px')
            $('#movie_player > div.ytp-tooltip.ytp-bottom > div.ytp-tooltip-text-wrapper > span').text('NicoTube')
        }
        nicoTubeSwitch.get(0).onmouseout = () => {
            isMouseOn = false;
            hoverObserver.disconnect();
            $('#movie_player > div.ytp-tooltip.ytp-bottom').css('display', 'none')
        }

        // comment right click
        $(document).on('contextmenu', (e) => {
            let x = e.clientX;
            let y = e.clientY;
            let canvasX = $(commentCanvas).offset().left;
            let canvasY = $(commentCanvas).offset().top;
            if (canvasX <= x && x <= canvasX + commentCanvas.width && canvasY <= y && y <= canvasY + commentCanvas.height){
                y = y - canvasY;
                let lane = Math.floor(y / (commentCanvas.height * config.fontSize * (config.commentMargin + 1)))
                let matchComment;
                comments[lane].reverse().some((comment) => {
                    let comX = commentCanvas.width - (commentCanvas.width + comment.width) * ((currentTick() - comment.timestamp) / (config.commentSpeed));
                    if (comX <= x && x <= comX + comment.width){
                        matchComment = comment;
                        return true;
                    }
                })
                if (matchComment){
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(matchComment)
                    $(commentCanvas).css('pointer-events', '');
                    return false;
                }
            }
        });

        // click canvas after right click comment
        commentCanvas.onclick = () => {
            $(commentCanvas).css('pointer-events', 'none');
        }

        // current tick calculator
        let currentTickFrame = 0;
        let stopped = null;
        let stoppedTime = 0.0;

        const currentTick = () => {
            return video.currentTime
        }

        const createCanvas = (width, height) => {
            let cvs = document.createElement('canvas');
            cvs.width = width;
            cvs.height = height*2;
            let context = cvs.getContext('2d');
            context.font = `${config.isBold? 'bold' : ''} ${commentCanvas.height * config.fontSize}pt '${config.fontFamily}'`;
            context.shadowColor = config.fontColor;
            context.textBaseline = 'top';
            context.fillStyle = config.fontColor;
            context.lineWidth = commentCanvas.height * config.fontSize * config.borderWidth;
            context.strokeStyle = config.borderColor;
            return [cvs, context]
        }

        // resize canvas handler
        const mainCanvasResize = () => {
            commentCanvas.width = player.getBoundingClientRect().width;
            commentCanvas.height = player.getBoundingClientRect().height;
            ctx.font = `${config.isBold? 'bold' : ''} ${commentCanvas.height * config.fontSize}pt '${config.fontFamily}'`;
            ctx.shadowColor = config.fontColor;
            ctx.globalAlpha = config.canvasAlpha;
            ctx.textBaseline = 'top';
            ctx.fillStyle = config.fontColor;
            ctx.lineWidth = commentCanvas.height * config.fontSize * config.borderWidth;
            ctx.strokeStyle = config.borderColor;
        };
        mainCanvasResize();

        // resize observe
        let whenResized;
        const resizeObserver = new ResizeObserver(entry => {
            clearTimeout(whenResized);
            whenResized = setTimeout(resizeHandler, 300);
        });
        resizeObserver.observe(video);

        const resizeHandler = () => {
            resized = true;
            $(commentCanvas).width(player.width);
            $(commentCanvas).height(player.height);
            mainCanvasResize();
            comments.forEach((commentLine) => {
                commentLine.forEach((comment) => {
                    comment.redraw();
                })
            })
            let chatFieldWait;
            commentObserver.disconnect()
            chatFieldWait = setInterval(() => {
                chatField = getChatField();
                if (chatField){
                    clearInterval(chatFieldWait);
                    commentObserver.observe(chatField, commentObserveConfig);
                }
            }, 100)
        }

        // comment observe
        let messageFieldSelector = '#message';
        const commentInit = () => {return [...Array(Math.floor(1 / config.fontSize / (1 + config.commentMargin )))].map(x=>[])}
        let comments = commentInit();
        const commentObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0){
                    Array.from(mutation.addedNodes).forEach((node) => {
                        if ($(node).find('#card').hasClass('yt-live-chat-viewer-engagement-message-renderer')){
                            console.log('special chat engage!!!');
                            return
                        }
                        let minLine, minMove = 10e30;
                        let parsedComment = parseComment(node);
                        if (parsedComment.postTIme < currentTick() - config.commentSpeed){
                            return;
                        }
                        let commentSize = calcCommentSize(parsedComment);
                        let commentWidth = commentSize[0];
                        let fullMoveWidth = $(commentCanvas).width() + commentWidth;
                        let commentCanvasRatio = $(commentCanvas).width() / fullMoveWidth;
                        let startGetOut = currentTick() + commentCanvasRatio * config.commentSpeed;
                        let _ = comments.some((commentLine)=>{
                            let lastCommentShowComplete = commentLine.length == 0 || config.commentSpeed / (commentCanvas.width + commentLine[commentLine.length - 1].width) * commentLine[commentLine.length - 1].width + commentLine[commentLine.length - 1].timestamp
                            if (commentLine.length == 0 || (commentLine[commentLine.length - 1].expired < startGetOut && lastCommentShowComplete < currentTick())){
                                commentLine.push(commentObj(parsedComment, currentTick(), currentTick() + config.commentSpeed, commentSize));
                                return true;
                            }
                            if (minMove > commentLine[commentLine.length - 1].expired){
                                minMove = commentLine[commentLine.length - 1].expired;
                                minLine = commentLine;
                            }
                        }) || (() => {minLine.push(commentObj(parsedComment, currentTick(), currentTick() + config.commentSpeed, commentSize)); return true})();
                    })
                }
            });
        });
        let commentObserveConfig = { attributes: false, childList: true, characterData: false };
        commentObserver.observe(chatField, commentObserveConfig);


        // render to offscreen canvas
        const drawCommentOffScreen = (canvas, context, comment) => {
            console.log('drawing')
            let currentX = 0;
            let imageSrc, newImage;
            let loadedCount = 0;
            let toBeLoaded = 0;
            let newImages = [];
            comment.parsed.forEach((seps)=>{
                switch (seps.type){
                    case 0:
                        context.strokeText(seps.text, Math.floor(currentX), 5);
                        context.fillText(seps.text, Math.floor(currentX), 5);
                        currentX += seps.width;
                        break
                    case 1:
                        newImage = new Image();
                        imageSrc = seps.src;
                        toBeLoaded += 1;
                        newImage.onload = () => {
                            loadedCount += 1;
                            if (loadedCount == toBeLoaded){
                                newImages.forEach((image) => {
                                    context.drawImage(image, Math.floor(image.cX), 0, Math.floor(commentCanvas.height * config.fontSize), Math.floor(commentCanvas.height * config.fontSize));
                                })
                            }
                        }
                        newImage.src = imageSrc;
                        newImage.cX = currentX;
                        currentX += seps.width;
                        newImages.push(newImage)
                        break
                }
            })
        }


        // each comment object
        const commentObj = (comment, timestamp, expired, size) => {
            let obj = {
                comment: comment,
                timestamp: timestamp,
                expired: expired,
                width: size[0],
                height: size[1]
            }
            let canvasCtx = createCanvas(obj.width, obj.height);
            obj.canvas = canvasCtx[0]
            obj.ctx = canvasCtx[1];

            obj.redraw = () => {
                let size = calcCommentSize(obj.comment)
                obj.width = size[0];
                obj.height = size[1] * 2;
                obj.canvas.width = obj.width;
                obj.canvas.height = obj.height;
                obj.ctx.font = `${config.isBold? 'bold' : ''} ${commentCanvas.height * config.fontSize}pt '${config.fontFamily}'`;
                obj.ctx.textBaseline = 'top';
                obj.ctx.fillStyle = config.fontColor;
                obj.ctx.lineWidth = commentCanvas.height * config.fontSize * config.borderWidth;
                obj.ctx.strokeStyle = config.borderColor;
                console.log(obj.ctx.font)
                drawCommentOffScreen(obj.canvas, obj.ctx, obj.comment);
            }

            drawCommentOffScreen(obj.canvas, obj.ctx, obj.comment);
            return obj
        };

        // each statement object
        const stateObj = (type, data) => {
            let obj = {type: type};
            let elem;
            switch (type){
                case 0: // str
                    obj.text = data;
                    break;
                case 1: // img
                    elem = $(data);
                    obj.src = elem.attr('src');
                    obj.text = elem.attr('alt');
                    obj.isPureEmoji = obj.text.length == 1
                    break;
            }
            return obj
        }

        // comment parse
        const parseComment = (comment) => {
            let userIdIndexOfImageSrc = 6;
            // 0: str
            // 1: image

            let obj = new Object();
            obj.parsed = new Array();
            obj.id = comment.id;
            obj.from = $(comment.querySelector('#img')).attr('src').split('/')[userIdIndexOfImageSrc]
            let timestamp = $(comment.querySelector('#timestamp')).text().split(':')
            obj.postTIme = (timestamp.length == 2)? timestamp[0] * 60 + timestamp[1] * 1 : timestamp[0] * 3600 + timestamp[1] * 60 + timestamp[2] * 1;
            comment = comment.querySelector(messageFieldSelector).innerHTML;

            let imagetagSeparator = /(<img.+?>)/g;
            let separated = comment.split(imagetagSeparator);
            separated.filter(n => n);
            separated.forEach((sep) => {
                if (imagetagSeparator.test(sep)){
                    obj.parsed.push(stateObj(1, sep))
                } else {
                    obj.parsed.push(stateObj(0, sep))
                }
            });
            obj.hash = obj.parsed.map((com) => {return com.text}).join('').hashCode();
            return obj
        };

        const calcCommentSize = (comment) => {
            let width = 0.0;
            let height = 0.0;
            let fullwidth = ctx.measureText('--').width;
            let currentWidth;
            let metrics;
            comment.parsed.forEach((state) => {
                switch (state.type){
                    case 0: // str
                        metrics = ctx.measureText(state.text);
                        currentWidth = metrics.width
                        height = Math.max(height, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)
                        width += currentWidth;
                        state.width = currentWidth;
                        break;
                    case 1: // emoji
                        width += fullwidth;
                        state.width = fullwidth;
                        break
                };
            });
            return [width, height]
        }


        // comment expire
        let expireInterval = setInterval(()=>{
            comments.forEach((commentLine)=>{
                commentLine.forEach((comment) =>{
                    if (comment.expired < currentTick() || comment.timestamp > currentTick()){
                        commentLine[0].canvas.remove();
                        commentLine.shift();
                    }
                });
            });
        }, 100);

        // stop-play observe
        const checkVideoIsPaused = () => {return !video.paused}
        video.onpause = () => {currentPlayState = 0;}
        video.onplay = () => {currentPlayState = 1;}

        // seek handler
        video.onseeking = () => {
            currentPlayState = 0;
            console.log('seeking');
        }
        video.onseeked = () => {
            currentPlayState = checkVideoIsPaused();
            console.log('seeked');
        }

        // draw　comment
        const drawComment = (comment, x, y) => {
            ctx.drawImage(comment.canvas, x, y);
        }

        // update
        const update = () => {
            if ((!currentPlayState || !nicoTubeOn) && !resized) {
                requestAnimationFrame(update);
                return;
            }
            resized = false;
            ctx.clearRect(0, 0, commentCanvas.width, commentCanvas.height);
            for (const [index, commentLine] of comments.entries()) {
                commentLine.forEach((comment) => {
                    let commentWidth = comment.width;
                    let x = commentCanvas.width - (commentCanvas.width+commentWidth) * ((currentTick() - comment.timestamp) / (config.commentSpeed));
                    let y = index * commentCanvas.height * config.fontSize * (config.commentMargin + 1);
                    drawComment(comment, x, y);
                })
            }
            requestAnimationFrame(update);
        };
        update();
    };
})();