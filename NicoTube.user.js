// ==UserScript==
// @name            NicoTube
// @namespace       NicoTube
// @version         0.0.1
// @description     Youtubeのライブチャットをniconicoの様に描画します
// @author          @nagataaaas
// @name:en         NicoTube
// @description:en  Render Youtube live chat on the video just like niconico
// @match           https://www.youtube.com/*
// @require         https://code.jquery.com/jquery-3.3.1.min.js
// @grant        none
/* globals jQuery, $ */
// ==/UserScript==

// comment icon by Freepik(http://www.freepik.com/) from www.flaticon.com
let availableIcon = `<path d="m0 0v342h120.148438v112.054688l181.253906-112.054688h210.597656v-342zm360.996094 214.335938h-209.992188v-30h209.988282v30zm0-65.175782h-209.992188v-30h209.988282v30zm0 0" fill="white" id="nicotubepath1"/>`
let unavailableIcon = `<path d="m0 0v342h120.148438v112.054688l181.253906-112.054688h210.597656v-342zm482 312h-189.121094l-142.730468 88.238281v-88.238281h-120.148438v-282h452zm0 0" fill="white" id="nicotubepath2" style="visibility:hidden;"/><path d="m151.003906 121.160156h209.988282v30h-209.988282zm0 0" fill="white" id="nicotubepath3" style="visibility:hidden;"/><path d="m151.003906 183h209.988282v30h-209.988282zm0 0" fill="white" id="nicotubepath4" style="visibility:hidden;"/>`
let commentToggleButton = `<button class="ytp-button" aria-label="NicoTibe" title="NicoTibe" show="true" id="nicotubeswitch"><svg height="100%" viewBox="-128 -157 768 768" width="100%">${availableIcon}${unavailableIcon}</svg></button>`

const getVars = () => {
    let userConfig = {
        commentSpeed: 5, // from appear to disappear
        fontFamily: 'ＭＳ Ｐゴシック', // font of chat
        fontSize: 0.055, // Relative size to height of video
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

$(document).ready(() => {
    waitReady();
})


const waitReady = () => {
    let waitInterval;
    let findCount = 1;
    let chatFrameSelector = '#chatframe';
    clearInterval(waitInterval);
    waitInterval = setInterval(() => {
        findCount++;
        if(findCount > 180){
            clearInterval(findCount);
            findCount = 0;
        }
        if($(chatFrameSelector)){
            if(getPlayer() && getChatField()){
                clearInterval(waitInterval);
                nicoChat();

                findCount = 0;
            }
        }
    }, 1000);
}


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
        context.font = `${commentCanvas.height * config.fontSize}pt '${config.fontFamily}'`;
        context.shadowColor = config.fontColor;
        context.textBaseline = 'top';
        context.fillStyle = config.fontColor;
        context.lineWidth = commentCanvas.height * config.fontSize * config.borderWidth;
        context.strokeStyle = config.borderColor;
        return [cvs, context]
    }

    // resize canvas handler
    const mainCanvasResize = () => {
        ctx.font = `${commentCanvas.height * config.fontSize}pt '${config.fontFamily}'`;
        ctx.shadowColor = config.fontColor;
        ctx.globalAlpha = config.canvasAlpha;
        ctx.textBaseline = 'top';
        ctx.fillStyle = config.fontColor;
        ctx.lineWidth = commentCanvas.height * config.fontSize * config.borderWidth;
        ctx.strokeStyle = config.borderColor;
    };
    mainCanvasResize();

    // resize observe
    const resizeObserver = new ResizeObserver(entry => {
        $(commentCanvas).width(player.width);
        $(commentCanvas).height(player.height);
        comments.forEach((commentLine) => {
            commentLine.forEach((comment) => {
                comment.redraw();
            })
        })
        mainCanvasResize();
        let chatFieldWait;
        chatFieldWait = setInterval(() => {
            chatField = getChatField();
            if (chatField){
                clearInterval(chatFieldWait);
                commentObserver.observe(chatField, commentObserveConfig);
            }
        }, 100)
    });
    resizeObserver.observe(video);

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
                    let parsedComment = parseComment(node.querySelector(messageFieldSelector).innerHTML);
                    let commentWidth = calcCommentWidth(parsedComment);
                    let fullMoveWidth = $(commentCanvas).width() + commentWidth;
                    let commentCanvasRatio = $(commentCanvas).width() / fullMoveWidth;
                    let startGetOut = currentTick() + commentCanvasRatio * config.commentSpeed;
                    let _ = comments.some((commentLine)=>{
                        let lastCommentShowComplete = commentLine.length == 0 || config.commentSpeed / (commentCanvas.width + commentLine[commentLine.length - 1].width) * commentLine[commentLine.length - 1].width + commentLine[commentLine.length - 1].timestamp
                        if (commentLine.length == 0 || (commentLine[commentLine.length - 1].expired < startGetOut && lastCommentShowComplete < currentTick())){
                            commentLine.push(commentObj(parsedComment, currentTick(), currentTick() + config.commentSpeed, commentWidth));
                            return true;
                        }
                        if (minMove > commentLine[commentLine.length - 1].expired){
                            minMove = commentLine[commentLine.length - 1].expired;
                            minLine = commentLine;
                        }
                    }) || (() => {minLine.push(commentObj(parsedComment, currentTick(), currentTick() + config.commentSpeed, commentWidth)); return true})();
                })
            }
        });
    });
    let commentObserveConfig = { attributes: false, childList: true, characterData: false };
    commentObserver.observe(chatField, commentObserveConfig);


    // render to offscreen canvas

    const drawCommentOffScreen = (canvas, context, comment) => {
        let currentX = 0;
        let image;
        comment.parsed.forEach((seps)=>{
            switch (seps.type){
                case 0:
                    context.strokeText(seps.text, Math.floor(currentX), 0);
                    context.fillText(seps.text, Math.floor(currentX), 0);
                    currentX += seps.width;
                    break
                case 1:
                    image = window.frames.chatframe.contentDocument.getElementById(seps.id);
                    if (image){
                        context.drawImage(image, Math.floor(currentX), 0, Math.floor(commentCanvas.height * config.fontSize), Math.floor(commentCanvas.height * config.fontSize));
                        currentX += seps.width;
                    } else {
                        image.onload = () => {
                            context.drawImage(image, Math.floor(currentX), 0, Math.floor(commentCanvas.height * config.fontSize), Math.floor(commentCanvas.height * config.fontSize));
                            currentX += seps.width;
                        }
                        console.log('set onload!!!')
                    }
                    break
            }
        })
    }


    // each comment object
    const commentObj = (comment, timestamp, expired, width) => {
        let obj = {
            comment: comment,
            timestamp: timestamp,
            expired: expired,
            width: width,
        }
        obj.redraw = () => {
            if (obj.canvas) obj.canvas.remove();
            obj.width = calcCommentWidth(obj.comment);
            obj.height = commentCanvas.height * config.fontSize;
            let cvsCtx = createCanvas(obj.width, commentCanvas.height * config.fontSize);
            obj.canvas = cvsCtx[0];
            obj.ctx = cvsCtx[1];
            drawCommentOffScreen(obj.canvas, obj.ctx, obj.comment);
        }
        obj.redraw();
        return obj
    };

    // each statement object
    const stateObj = (type, data) => {
        let obj = {type: type};
        switch (type){
            case 0: // str
                obj.text = data;
                break;
            case 1: // img
                obj.id = data;
                break;
        }
        return obj
    }

    // comment parse
    const parseComment = (comment) => {
        // 0: str
        // 1: image

        let obj = new Object();
        obj.parsed = new Array();

        let imagetagSeparator = /(<img.+?>)/g;
        let separated = comment.split(imagetagSeparator);
        separated.filter(n => n);
        separated.forEach((sep) => {
            if (imagetagSeparator.test(sep)){
                obj.parsed.push(stateObj(1, $(sep).attr('id')))
            } else {
                obj.parsed.push(stateObj(0, sep))
            }
        });
        return obj
    };

    const calcCommentWidth = (comment) => {
        let width = 0.0;
        let fullwidth = ctx.measureText('--').width;
        let currentWidth;
        comment.parsed.forEach((state) => {
            switch (state.type){
                case 0: // str
                    currentWidth = ctx.measureText(state.text).width
                    width += currentWidth;
                    state.width = currentWidth;
                    break;
                case 1: // emoji
                    width += fullwidth;
                    state.width = fullwidth;
                    break
            };
        });
        return width
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
        if (!currentPlayState || !nicoTubeOn) {
            requestAnimationFrame(update);
            return;
        }
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