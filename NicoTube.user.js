// ==UserScript==
// @name            NicoTube
// @namespace       NicoTube
// @version         0.0.16
// @description     Youtubeのライブチャットをniconicoの様に描画します
// @author          @nagataaaas
// @name:en         NicoTube
// @description:en  Render Youtube live chat on the video just like niconico
// @match           https://www.youtube.com/*
// @require         https://code.jquery.com/jquery-3.3.1.min.js
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_setClipboard
// @noframes
/* globals jQuery, $ */
// ==/UserScript==

// comment icon by Freepik(http://www.freepik.com/) from www.flaticon.com
// block icon by Those Icons(https://www.flaticon.com/free-icon/) from www.flaticon.com

(function () {
    'use strict';

    const getVars = () => {
        return {
            commentSpeed: GM_getValue('commentSpeed', 5), // from appear to disappear
            fontFamily: 'Arial', // font of chat
            userCommentStrokeColor: 'yellow', // color of box of user comment
            isBold: true, // is comment font bold
            emojiBorder: true, // whether show border to emoji
            fontSize: 0.05, // Relative size to height of video
            commentMargin: 0.7, // Relative size to fontSize
            fontColor: '#FFFFFF', // color of comment (default to white
            memberFontColor: '#2cb879', // color of member comment (default to green
            moderatorFontColor: '#7581b8', // color of moderator comment (default to purple
            canvasAlpha: 0.5, // alpha of comment
            borderWidth: 0.15, // Relative size to fontSize
            borderColor: '#000000', // color of border (default to black
            blockedUsers: [], // list of list of blocked userid [[userID, comment], [userID, comment], [userID, comment]...]
            blockedComments: [], // list of list of hash of blocked AllCommentLanes [[hash, actual comment], [hash, actual comment], [hash, actual comment]...],
            blockedKeyWords: [], // list of blocked keyword [keyword, keyword, keyword...] (word can be regex)
            showSuperChatAmount: true, // whether show the amount of super chat
            showSuperChatBackground: true, // whether show the background of super chat
            showSuperChatStroke: true, // whether show the stroke of super chat
            changeColorOfMember: true, // whether change the color of member
            changeColorOfModerator: true, // whether change the color of moderator
            welcomeNewMember: true // pop welcome animation to new member
        };
    };

    let AllCommentLanes;
    let globalMutations = {
        comment: null,
        contextMenu: null,
        hover: null
    };
    // vars

    let config;
    let player;
    let chatField;
    let nicoTubeOn;
    let needToRedraw;
    let currentPlayState;
    let toolBarRight;
    let nicoTubeSwitch;
    let commentCanvas;
    let commentContext;
    let video;

    let contextMenuCanvas;
    let settingButton;
    let isMouseOn;
    let nicoTubeContextMenu;
    let commentAddMutation;

    // intervals
    let expireInterval;
    let waitReadyInterval;
    let chatFieldWait;


    // id of each elements
    let nicoTubeContextMenuWrapperID = 'nicoTubeContextMenuWrapper';
    let nicoChatCanvasID = 'nicoChatCanvas';
    let nicoTubeSwitchID = 'nicoTubeSwitch';
    let videoSelector = '#movie_player > div.html5-video-container > video';
    let rightToolBarSelector = '#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-right-controls';
    let toolNamePopSelector = '#movie_player > div.ytp-tooltip.ytp-bottom';
    let contextMenuCanvasID = 'contextMenuCanvas';
    let messageFieldSelector = '#message';

    // html elements
    let availableIcon = `<path d="m0 0v342h120.148438v112.054688l181.253906-112.054688h210.597656v-342zm360.996094 214.335938h-209.992188v-30h209.988282v30zm0-65.175782h-209.992188v-30h209.988282v30zm0 0" fill="white" id="nicoTubepath1"/>`;
    let unavailableIcon = `<path d="m0 0v342h120.148438v112.054688l181.253906-112.054688h210.597656v-342zm482 312h-189.121094l-142.730468 88.238281v-88.238281h-120.148438v-282h452zm0 0" fill="white" id="nicoTubepath2" style="visibility:hidden;"/><path d="m151.003906 121.160156h209.988282v30h-209.988282zm0 0" fill="white" id="nicoTubepath3" style="visibility:hidden;"/><path d="m151.003906 183h209.988282v30h-209.988282zm0 0" fill="white" id="nicoTubepath4" style="visibility:hidden;"/>`;
    let nicoTubeToggleSwitch = `<button class="ytp-button" show="true" id="${nicoTubeSwitchID}"><svg height="100%" viewBox="-128 -157 768 768" width="100%">${availableIcon}${unavailableIcon}</svg></button>`;
    let canvasHtml = `<canvas id='${nicoChatCanvasID}' style='pointer-events: none; z-index:2000;' position='absolute'></canvas>`;
    let nicoTubeContextMenuHTML = `
        <div class="ytp-popup ytp-contextmenu" style="width: 300px; height: 240px; display: none;" id="nicoTubeContextMenu">
        <div class="ytp-panel" style="min-width: 250px; width: 300px; height: 240px;">

        <canvas id="contextMenuCanvas"></canvas>

        <div class="ytp-panel-menu" role="menu" style="height: 180px;">
        <div class="ytp-menuitem" aria-haspopup="false" aria-checked="false" tabindex="0" id="userBlock">
        <div class="ytp-menuitem-icon">
        <svg fill="none" height="24" viewBox="0 0 512 512" width="24">
        <path d="M426.667,85.333c-7.76,0-15.052,2.083-21.333,5.729V64c0-23.531-19.135-42.667-42.667-42.667    c-8.781,0-16.938,2.667-23.729,7.219C333.094,11.948,317.25,0,298.667,0c-18.583,0-34.427,11.948-40.271,28.552    c-6.792-4.552-14.948-7.219-23.729-7.219C211.135,21.333,192,40.469,192,64v264.146c0,5.375-3.542,8.135-5.063,9.073    s-5.615,2.865-10.375,0.469l-68.5-34.25c-6.24-3.125-13.229-4.771-20.208-4.771c-24.917,0-45.187,20.271-45.187,45.188V352    c0,2.958,1.229,5.781,3.385,7.802l123.115,114.906C194.937,498.75,228.542,512,263.781,512h66.885    c76.458,0,138.667-62.208,138.667-138.667V128C469.333,104.469,450.198,85.333,426.667,85.333z M448,373.333    c0,64.698-52.635,117.333-117.333,117.333h-66.885c-29.813,0-58.25-11.208-80.052-31.563L64,347.365v-3.51    C64,330.698,74.698,320,87.854,320c3.677,0,7.375,0.875,10.667,2.521l68.5,34.25c9.969,5.01,21.635,4.458,31.135-1.396    c9.5-5.875,15.177-16.052,15.177-27.229V64c0-11.76,9.573-21.333,21.333-21.333C246.427,42.667,256,52.24,256,64v138.667    c0,5.896,4.771,10.667,10.667,10.667c5.896,0,10.667-4.771,10.667-10.667v-160c0-11.76,9.573-21.333,21.333-21.333    c11.76,0,21.333,9.573,21.333,21.333v160c0,5.896,4.771,10.667,10.667,10.667c5.896,0,10.667-4.771,10.667-10.667V64    c0-11.76,9.573-21.333,21.333-21.333S384,52.24,384,64v170.667c0,4.042,2.323,7.75,5.938,9.563c0.01,0,0.021,0.01,0.042,0.021    s0.042,0.021,0.063,0.031c0.052,0.021,0.104,0.042,0.146,0.073c0.021,0,0.021,0.021,0.042,0.01l0.01,0.01    c0.01,0,0.021,0.01,0.021,0.01c0.021,0.01,0.021,0.01,0.042,0.01c0.01,0.021,0.021,0.021,0.031,0.021l0.031,0.01    c0.01,0,0.01,0.021,0.042,0.021c0.021,0.042,0.042,0.01,0.042,0.01c5.135,2.25,11.24,0.094,13.802-5    c0.917-1.844,1.26-3.823,1.083-5.729V128c0-11.76,9.573-21.333,21.333-21.333S448,116.24,448,128V373.333z" fill="white"/>
        </svg>
        </div>
        <div class="ytp-menuitem-label">投稿ユーザーブロック</div>
        <div class="ytp-menuitem-content"></div>
        </div>

        <div class="ytp-menuitem" aria-haspopup="false" role="menuitem" tabindex="0" id="commentBlock">
        <div class="ytp-menuitem-icon">
        <svg fill="none" height="24" viewBox="0 0 512 512" width="24">
        <path d="M426.667,85.333c-7.76,0-15.052,2.083-21.333,5.729V64c0-23.531-19.135-42.667-42.667-42.667    c-8.781,0-16.938,2.667-23.729,7.219C333.094,11.948,317.25,0,298.667,0c-18.583,0-34.427,11.948-40.271,28.552    c-6.792-4.552-14.948-7.219-23.729-7.219C211.135,21.333,192,40.469,192,64v264.146c0,5.375-3.542,8.135-5.063,9.073    s-5.615,2.865-10.375,0.469l-68.5-34.25c-6.24-3.125-13.229-4.771-20.208-4.771c-24.917,0-45.187,20.271-45.187,45.188V352    c0,2.958,1.229,5.781,3.385,7.802l123.115,114.906C194.937,498.75,228.542,512,263.781,512h66.885    c76.458,0,138.667-62.208,138.667-138.667V128C469.333,104.469,450.198,85.333,426.667,85.333z M448,373.333    c0,64.698-52.635,117.333-117.333,117.333h-66.885c-29.813,0-58.25-11.208-80.052-31.563L64,347.365v-3.51    C64,330.698,74.698,320,87.854,320c3.677,0,7.375,0.875,10.667,2.521l68.5,34.25c9.969,5.01,21.635,4.458,31.135-1.396    c9.5-5.875,15.177-16.052,15.177-27.229V64c0-11.76,9.573-21.333,21.333-21.333C246.427,42.667,256,52.24,256,64v138.667    c0,5.896,4.771,10.667,10.667,10.667c5.896,0,10.667-4.771,10.667-10.667v-160c0-11.76,9.573-21.333,21.333-21.333    c11.76,0,21.333,9.573,21.333,21.333v160c0,5.896,4.771,10.667,10.667,10.667c5.896,0,10.667-4.771,10.667-10.667V64    c0-11.76,9.573-21.333,21.333-21.333S384,52.24,384,64v170.667c0,4.042,2.323,7.75,5.938,9.563c0.01,0,0.021,0.01,0.042,0.021    s0.042,0.021,0.063,0.031c0.052,0.021,0.104,0.042,0.146,0.073c0.021,0,0.021,0.021,0.042,0.01l0.01,0.01    c0.01,0,0.021,0.01,0.021,0.01c0.021,0.01,0.021,0.01,0.042,0.01c0.01,0.021,0.021,0.021,0.031,0.021l0.031,0.01    c0.01,0,0.01,0.021,0.042,0.021c0.021,0.042,0.042,0.01,0.042,0.01c5.135,2.25,11.24,0.094,13.802-5    c0.917-1.844,1.26-3.823,1.083-5.729V128c0-11.76,9.573-21.333,21.333-21.333S448,116.24,448,128V373.333z" fill="white"/>
        </svg>
        </div>
        <div class="ytp-menuitem-label">コメントブロック</div>
        <div class="ytp-menuitem-content"></div>
        </div>

        <div class="ytp-menuitem" aria-haspopup="false" role="menuitem" tabindex="0" id="commentCopy">
        <div class="ytp-menuitem-icon">
        <svg height="100%" viewBox="0 0 36 36" width="100%">
        <path d="M5.85 18.0c0.0-2.56 2.08-4.65 4.65-4.65h6.0V10.5H10.5c-4.14 .0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5h6.0v-2.85H10.5c-2.56 .0-4.65-2.08-4.65-4.65zM12.0 19.5h12.0v-3.0H12.0v3.0zm13.5-9.0h-6.0v2.85h6.0c2.56 .0 4.65 2.08 4.65 4.65s-2.08 4.65-4.65 4.65h-6.0V25.5h6.0c4.14 .0 7.5-3.36 7.5-7.5s-3.36-7.5-7.5-7.5z" fill="#fff"></path>
        </svg>
        </div>
        <div class="ytp-menuitem-label">コメントコピー</div>
        <div class="ytp-menuitem-content"></div>
        </div>

        </div>
        </div>}`;

    // decode escaped html string
    const htmlDecode = (input) => {
        let doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    };

    const saveConfig = () => {
        // --------------------------------------------------------------------------------------------------------------------------------------
    };

    // add method to String to calculate it's hash
    Object.defineProperty(String.prototype, 'hashCode', {
        value: function () {
            let hash = 0, i, chr;
            for (i = 0; i < this.length; i++) {
                chr = this.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }
    });

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    const createElementFromHTML = (htmlString) => {
        let div = document.createElement('div');
        div.id = nicoTubeContextMenuWrapperID;
        document.body.append(div);
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    };

    let fontSizeCache;
    const calcFontSize = () => {
        if (!fontSizeCache) {
            fontSizeCache = commentCanvas.height * config.fontSize
        }
        return fontSizeCache
    };

    // functions to get elements
    const getChatField = () => {
        return document.getElementById('chatframe') && document.getElementById('chatframe').contentDocument.querySelector('#items.style-scope.yt-live-chat-item-list-renderer')
    };
    const getInputField = () => {
        return document.getElementById('chatframe') && document.getElementById('chatframe').contentDocument.querySelector('#input-panel')
    };
    const getPlayer = () => {
        return document.getElementById('movie_player')
    };
    const getNicoTubeSwitch = () => {
        return document.getElementById(nicoTubeSwitchID)
    };
    const getChatCanvas = () => {
        return document.getElementById(nicoChatCanvasID)
    };
    const getContextMenuWrapper = () => {
        return document.getElementById(nicoTubeContextMenuWrapperID)
    };
    const getRightToolBar = () => {
        return document.querySelector(rightToolBarSelector);
    };
    const getVideo = () => {
        return document.querySelector(videoSelector);
    };
    const getToolNamePop = () => {
        return document.querySelector(toolNamePopSelector);
    };
    const getContextMenuCanvas = () => {
        return document.getElementById(contextMenuCanvasID);
    };


    // observe url change.
    let hrefHist = location.href;
    const URLChangeObserver = new MutationObserver(function (mutations) {
        if (hrefHist !== location.href) {
            hrefHist = location.href;
            nicoTubeFinalize();
            waitReady();
        }
    });
    URLChangeObserver.disconnect();

    // wait live chat box pops up and be ready
    const waitReady = () => {
        let findCount = 1;
        clearInterval(waitReadyInterval);
        waitReadyInterval = setInterval(() => {
            findCount++;
            if (findCount > 30) {
                clearInterval(waitReadyInterval);
            }
            if (getPlayer() && getChatField()) {
                clearInterval(waitReadyInterval);
                nicoTubeInit();
            }
        }, 1000);
    };
    // and run when browser is ready
    $(document).ready(() => {
        URLChangeObserver.observe(document, {childList: true, subtree: true});
        waitReady();
    });


    const nicoTubeInit = () => {
        // setting
        setTimeout(() => {
            config = getVars();
            player = getPlayer();
            chatField = getChatField();
            nicoTubeOn = true;
            needToRedraw = false;
            currentPlayState = 1;
        });

        setTimeout(() => {
            // add nicoTube switch
            toolBarRight = getRightToolBar();
            toolBarRight.insertAdjacentHTML('afterbegin', nicoTubeToggleSwitch);
            nicoTubeSwitch = getNicoTubeSwitch();
        });

        setTimeout(() => {
            // comment Canvas
            player.insertAdjacentHTML('afterbegin', canvasHtml);
            commentCanvas = getChatCanvas();
            commentContext = commentCanvas.getContext('2d');
        });

        setTimeout(() => {
            // player settings
            video = getVideo();
            // positions
            player.style.position = 'relative';
            commentCanvas.style.position = 'absolute';
            video.style.position = 'absolute';
        });

        setTimeout(() => {
            setNicoTubeSwitch();
            setCommentCanvas();
            mainCanvasResize();
            setResizeObserve();
        });

        setTimeout(() => {
            AllCommentLanes = commentInit();

            setCommentObserve();
            setExpireInterval();
            setNicoTubeContextMenu();
            setVideoOn();
        });

        setTimeout(() => {
            update();
        })

    };

    const nicoTubeFinalize = () => {
        // stop finding chat box and disconnect all mutations
        clearInterval(waitReadyInterval);
        globalMutations.comment && globalMutations.comment.disconnect();
        globalMutations.hover && globalMutations.hover.disconnect();
        globalMutations.contextMenu && globalMutations.contextMenu.disconnect();

        // remove all element created by nicoTube
        getNicoTubeSwitch() && getNicoTubeSwitch().remove();
        getChatCanvas() && getChatCanvas().remove();
        getContextMenuWrapper() && getContextMenuWrapper().remove();

        // remove interval
        expireInterval && clearInterval(expireInterval);
        waitReadyInterval && clearInterval(waitReadyInterval);
        chatFieldWait && clearInterval(chatFieldWait);

        // clear all chat element
        AllCommentLanes && AllCommentLanes.forEach((commentLane) => {
            commentLane.forEach(() => {
                commentLane.shift();
            });
        });
    };

    // on off switch
    const setNicoTubeSwitch = () => {
        nicoTubeSwitch.onclick = () => {
            let currentSwitch = $(nicoTubeSwitch).attr('show') == 'true';
            $(nicoTubeSwitch).attr('show', !currentSwitch);
            $('#nicoTubepath1').css('visibility', (currentSwitch ? 'hidden' : 'visible'));
            $('#nicoTubepath2').css('visibility', (!currentSwitch ? 'hidden' : 'visible'));
            $('#nicoTubepath3').css('visibility', (!currentSwitch ? 'hidden' : 'visible'));
            $('#nicoTubepath4').css('visibility', (!currentSwitch ? 'hidden' : 'visible'));
            nicoTubeOn = !currentSwitch;
            $(commentCanvas).css('visibility', (nicoTubeOn ? 'visible' : 'hidden'));
        };

        // switch mouseover mouseout
        isMouseOn = false;

        const hoverObserver = globalMutations.hover || new MutationObserver((mutations) => {
            $('#movie_player > div.ytp-tooltip.ytp-bottom').css('display', '');
            $('#movie_player > div.ytp-tooltip.ytp-bottom').css('opacity', '1.0')
        });
        globalMutations.hover = hoverObserver;

        nicoTubeSwitch.onmouseover = () => {
            settingButton = document.querySelector('#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-right-controls > button.ytp-button.ytp-settings-button');
            isMouseOn = true;
            hoverObserver.disconnect();
            if (!getToolNamePop()) {
                let e = new Event('mouseover');
                settingButton.dispatchEvent(e);
                settingButton.classList.remove('ytp-preview');
                nicoTubeSwitch.onmouseover();
                return
            }
            hoverObserver.observe(getToolNamePop(), {
                attributes: true,
                childList: false,
                characterData: false
            });
            $(getToolNamePop()).css({'display': '', 'left': $(nicoTubeSwitch).offset().left + 'px'});
            $(getToolNamePop().querySelector('div.ytp-tooltip-text-wrapper > span')).text('NicoTube')
        };

        nicoTubeSwitch.onmouseout = () => {
            isMouseOn = false;
            hoverObserver.disconnect();
            $(getToolNamePop()).css({'display': 'none'})
        }
    };

    const setNicoTubeContextMenu = () => {
        // youtube default contextmenu
        nicoTubeContextMenu = createElementFromHTML(nicoTubeContextMenuHTML);


        const contextMenuCanvasInit = (menuCanvas) => {
            menuCanvas.width = 300;
            menuCanvas.height = 50;
        };

        const contextMenuCanvasDraw = (menuCanvas, fromCanvas) => {
            let contextMenuCanvasFontSize = 30;
            let menuCtx = menuCanvas.getContext('2d');
            let ratio = contextMenuCanvasFontSize / (calcFontSize() * 2);
            menuCanvas.width += 0;
            menuCtx.drawImage(fromCanvas, contextMenuCanvasFontSize * 2 / 3, contextMenuCanvasFontSize / 2, fromCanvas.width * ratio, fromCanvas.height * ratio)
        };

        const contextMenuPopObserver = globalMutations.contextMenu || new MutationObserver((mutations) => {
            mutations[0].target.style.display = 'none';
        });
        contextMenuCanvas = getContextMenuCanvas();
        contextMenuCanvasInit(contextMenuCanvas);
        globalMutations.contextMenu = contextMenuPopObserver;


        let rightClickTargetComment;
        let rightClickTargetCommentIndex;
        // comment right click
        $(document).on('contextmenu', (e) => {
            let x = e.clientX + window.pageXOffset;
            let y = e.clientY + window.pageYOffset;
            let canvasX = $(commentCanvas).offset().left;
            let canvasY = $(commentCanvas).offset().top;
            if (canvasX <= x && x <= canvasX + commentCanvas.width && canvasY <= y && y <= canvasY + commentCanvas.height) {
                y -= canvasY;
                let lane = Math.floor(y / (calcFontSize() * (config.commentMargin + 1)));
                let matchComment;
                if (!AllCommentLanes || !AllCommentLanes[lane]) return;
                let index = AllCommentLanes[lane].length - 1;
                AllCommentLanes[lane].reverse().some((comment) => {
                    let comX = commentCanvas.width - (commentCanvas.width + comment.width) * ((currentTick() - comment.timestamp) / (config.commentSpeed)) + commentCanvas.getBoundingClientRect().left;
                    if (comX <= x && x <= comX + comment.width) {
                        matchComment = comment;
                        rightClickTargetCommentIndex = {lane: lane, index: index};
                        return true;
                    }
                    index--;
                });
                if (!matchComment) {
                    return
                }
                rightClickTargetComment = matchComment;
                let youtubeContextMenu = document.querySelector('body > div.ytp-popup.ytp-contextmenu') || document.querySelector('#movie_player > div.ytp-popup.ytp-contextmenu.ytp-big-mode');
                youtubeContextMenu.style.display = 'none';
                contextMenuPopObserver.disconnect();
                contextMenuPopObserver.observe(youtubeContextMenu, {
                    attributes: true,
                    childList: false,
                    characterData: false,
                    attributeFilter: ['display']
                });

                e.preventDefault();

                setTimeout(() => {
                    $(nicoTubeContextMenu).css({
                        'top': y, 'left': x, 'display': ''
                    })
                }, 50);


                contextMenuCanvasDraw(contextMenuCanvas, matchComment.canvas);

                $(commentCanvas).css('pointer-events', '');
            }
        });

        // click on nicoTube context menu
        $('#userBlock').on('click', () => {
            $(nicoTubeContextMenu).css('display', 'none');
            $(commentCanvas).css('pointer-events', 'none');
            config.blockedUsers.push([rightClickTargetComment.from, commentToText(rightClickTargetComment)]);
            for (let i = 0; i < AllCommentLanes.length; i++) {
                AllCommentLanes[i] = AllCommentLanes[i].filter(comment => comment.from !== rightClickTargetComment.from)
            }
            needToRedraw = true;
        });

        $('#commentBlock').on('click', () => {
            config.blockedComments.push([rightClickTargetComment.hash, commentToText(rightClickTargetComment)]);
            $(nicoTubeContextMenu).css('display', 'none');
            $(commentCanvas).css('pointer-events', 'none');
            for (let i = 0; i < AllCommentLanes.length; i++) {
                AllCommentLanes[i] = AllCommentLanes[i].filter(comment => comment.hash !== rightClickTargetComment.hash)
            }
            needToRedraw = true;
        });

        $('#commentCopy').on('click', () => {
            $(nicoTubeContextMenu).css('display', 'none');
            $(commentCanvas).css('pointer-events', 'none');
            GM_setClipboard(commentToText(rightClickTargetComment));
        });

        $(commentCanvas).on('click', () => {
            $(commentCanvas).css('pointer-events', 'none');
        });
    };

    // comment to text to copy
    const commentToText = (comment) => {
        return comment.parsed.map((com) => {
            return com.text
        }).join('');
    };

    const setCommentCanvas = () => {
        // click canvas after right click comment
        commentCanvas.onclick = () => {
            $(nicoTubeContextMenu).css('display', 'none');
            globalMutations.contextMenu.disconnect();
        }
    };

    const currentTick = () => {
        return video.currentTime
    };

    const createCanvas = (width, height, comment) => {
        let cvs = new OffscreenCanvas(width * 1.2, height * 2);
        let context = cvs.getContext('2d');
        context.font = `${config.isBold ? 'bold' : ''} ${calcFontSize()}pt '${config.fontFamily}'`;
        context.textBaseline = 'top';
        if (comment.type === 0 || comment.type === 2 || (comment.type === 1 && !config.changeColorOfMember) || (comment.type === 5 && !config.changeColorOfModerator)) {
            context.fillStyle = config.fontColor;
        } else if (comment.type === 1) {
            context.fillStyle = config.memberFontColor;
        } else if (comment.type === 5) {
            context.fillStyle = config.moderatorFontColor;
        }
        context.lineWidth = calcFontSize() * config.borderWidth;
        context.strokeStyle = config.borderColor;
        return {canvas: cvs, context: context}
    };

    // resize canvas handler
    const mainCanvasResize = () => {
        commentCanvas.width = player.getBoundingClientRect().width;
        commentCanvas.height = video.getBoundingClientRect().height;
        commentCanvas.style.top = video.style.top;
        commentContext.font = `${config.isBold ? 'bold' : ''} ${calcFontSize()}pt '${config.fontFamily}'`;
        commentContext.shadowColor = config.fontColor;
        commentContext.globalAlpha = config.canvasAlpha;
        commentContext.textBaseline = 'top';
        commentContext.fillStyle = config.fontColor;
        commentContext.lineWidth = calcFontSize() * config.borderWidth;
        commentContext.strokeStyle = config.borderColor;
    };

    const setResizeObserve = () => {
        // resize observe
        let whenResized;
        const resizeObserver = new ResizeObserver(entry => {
            clearTimeout(whenResized);
            whenResized = setTimeout(resizeHandler, 300);
        });
        resizeObserver.disconnect();
        resizeObserver.observe(video);
        resizeObserver.observe(player);
    };

    const resizeHandler = () => {
        fontSizeCache = 0;
        nicoTubeOn = false;
        commentObserver.disconnect();
        needToRedraw = true;
        mainCanvasResize();
        AllCommentLanes.forEach((commentLane) => {
            commentLane.forEach((comment) => {
                setTimeout(() => {
                    comment.redraw();
                })
            })
        });
        chatFieldWait = setInterval(() => {
            chatField = getChatField();
            if (chatField) {
                clearInterval(chatFieldWait);
                nicoTubeOn = true;
                setTimeout(() => {
                    commentObserver.observe(chatField, {attributes: false, childList: true, characterData: false});
                })
            }
        }, 50)
    };

    // comment observe
    const commentInit = () => {
        return [...Array(Math.floor(1 / config.fontSize / (1 + config.commentMargin)))].map(x => [])
    };

    commentAddMutation = false;

    const commentObserver = globalMutations.comment || new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // wait for moment for image appear
            setTimeout(() => {
                if (mutation.addedNodes.length > 0) {
                    Array.from(mutation.addedNodes).forEach((node) => {
                        let minLine, minMove = 10e30;
                        let parsedComment = parseComment(node);

                        if (parsedComment.postTime < currentTick() - config.commentSpeed) {
                            return; // too old to add
                        }

                        if (config.blockedUsers.some((blockedUser) => { // blocked user
                            return blockedUser[0] == parsedComment.from
                        }) || config.blockedComments.some((blockedComment) => { // blocked comment
                            return blockedComment[0] == parsedComment.hash
                        }) || config.blockedKeyWords.some((blockedKeyWord) => {
                            return RegExp(blockedKeyWord).test(commentToText(parsedComment))
                        })) {
                            return
                        }

                        if (parsedComment.type === 4) {
                            return // youtube engage
                        } else if (parsedComment.type === 3) {
                            config.welcomeNewMember && welcomeNewMember(parsedComment);
                            return // new member banner
                        }

                        let commentSize = calcCommentSize(parsedComment);
                        let commentWidth = commentSize.width;
                        let fullMoveWidth = $(commentCanvas).width() + commentWidth;
                        let commentCanvasRatio = $(commentCanvas).width() / fullMoveWidth;
                        let startGetOut = currentTick() + commentCanvasRatio * config.commentSpeed;

                        // this will solve the problem that new many comments will flow into first lane
                        let addCommentInterval = setInterval(() => {
                            if (!commentAddMutation) {
                                clearInterval(addCommentInterval);
                                commentAddMutation = true;
                                AllCommentLanes.some((commentLane) => {
                                    let lastCommentShowComplete = commentLane.length === 0 || config.commentSpeed / (commentCanvas.width + commentLane[commentLane.length - 1].width) * commentLane[commentLane.length - 1].width + commentLane[commentLane.length - 1].timestamp;
                                    if (commentLane.length === 0 || (commentLane[commentLane.length - 1].expired < startGetOut && lastCommentShowComplete < currentTick())) {
                                        parsedComment.laneOffset = 0;
                                        commentLane.push(commentObj(parsedComment, currentTick(), currentTick() + config.commentSpeed, commentSize));
                                        return true;
                                    }
                                    if (minMove > commentLane[commentLane.length - 1].expired) {
                                        minMove = commentLane[commentLane.length - 1].expired;
                                        parsedComment.laneOffset = 0.5;
                                        minLine = commentLane;
                                    }
                                }) || (() => {
                                    minLine.push(commentObj(parsedComment, currentTick(), currentTick() + config.commentSpeed, commentSize));
                                    return true
                                })();
                                commentAddMutation = false;
                            }
                        }, getRandomInt(1, 5))
                    })
                }
            }, 200)
        });
    });

    const setCommentObserve = () => {
        globalMutations.comment = commentObserver;
        commentObserver.disconnect();
        commentObserver.observe(chatField, {attributes: false, childList: true, characterData: false});
    };


    // render to offscreen canvas
    const drawCommentOffScreen = (canvas, context, comment) => {
        let currentX = calcFontSize() * config.borderWidth * 2;
        let imageSrc, newImage;
        let loadedCount = 0;
        let toBeLoaded = 0;
        let newImages = [];
        if (comment.type === 2) {
            let wholeX = comment.parsed.map((seps) => {
                switch (seps.type) {
                    case 0:
                        return seps.width;
                    case 1:
                        return seps.width
                }
            }).reduce((p, x) => p + x, 0.0);
            let beforeFillStyle = context.fillStyle;
            let beforeStrokeStyle = context.strokeStyle;
            context.fillStyle = comment.BackGroundColor;
            config.showSuperChatBackground && context.fillRect(0, 0, wholeX + comment.height * 0.2, comment.height * 1.4);
            context.strokeStyle = comment.strokeColor;
            config.showSuperChatStroke && context.strokeRect(0, 0, wholeX + comment.height * 0.2, comment.height * 1.4);
            context.fillStyle = beforeFillStyle;
            context.strokeStyle = beforeStrokeStyle;
        }
        comment.parsed.forEach((seps) => {
            switch (seps.type) {
                case 0:
                    context.strokeText(seps.text, Math.floor(currentX), comment.height * 0.2);
                    context.fillText(seps.text, Math.floor(currentX), comment.height * 0.2);
                    currentX += seps.width;
                    break;
                case 1:
                    newImage = new Image();
                    imageSrc = seps.src;
                    toBeLoaded += 1;
                    newImage.onload = () => {
                        loadedCount += 1;
                        if (loadedCount === toBeLoaded) {
                            newImages.forEach((image) => {
                                if (config.emojiBorder) {
                                    context.save();
                                    context.filter = `drop-shadow(rgb(0,0, 0) 0px 0px 1px) drop-shadow(rgb(0,0, 0) 0px 0px ${calcFontSize() / 200}px)`.repeat(3);
                                }
                                context.drawImage(image, Math.floor(image.cX), comment.height * 0.1 / 1.2, seps.width / 1.2, seps.width / 1.2);
                                if (config.emojiBorder) {
                                    context.restore();
                                }
                            })
                        }
                    };
                    newImage.src = imageSrc;
                    newImage.cX = currentX + seps.width * 0.1 / 1.2;
                    currentX += seps.width;
                    newImages.push(newImage);
                    break
            }
        });
        if (comment.from === 'self') {
            context.strokeStyle = config.userCommentStrokeColor;
            context.strokeRect(0, 0, currentX, comment.height);
        }
    };


    // each comment object
    const commentObj = (parsedComment, timestamp, expired, size) => {
        let obj = {
            laneOffset: parsedComment.laneOffset,
            parsed: parsedComment.parsed,
            id: parsedComment.id,
            type: parsedComment.type,
            author: parsedComment.author,
            from: parsedComment.from,
            BackGroundColor: parsedComment.BackGroundColor,
            strokeColor: parsedComment.strokeColor,
            postTime: parsedComment.postTime,
            purchaseAmount: parsedComment.purchaseAmount,
            hash: parsedComment.hash,
            timestamp: timestamp,
            expired: expired,
            width: size.width,
            height: size.height
        };
        let canvasCtx = createCanvas(obj.width, obj.height, parsedComment);
        obj.canvas = canvasCtx.canvas;
        obj.ctx = canvasCtx.context;

        obj.redraw = () => {
            let size = calcCommentSize(obj);
            obj.width = size.width;
            obj.height = size.height;
            obj.canvas.width = obj.width * 1.2;
            obj.canvas.height = obj.height * 2;
            obj.ctx.font = `${config.isBold ? 'bold' : ''} ${calcFontSize()}pt '${config.fontFamily}'`;
            obj.ctx.textBaseline = 'top';
            if (obj.type === 0 || obj.type === 2 || (obj.type === 1 && !config.changeColorOfMember) || (obj.type === 5 && !config.changeColorOfModerator)) {
                obj.ctx.fillStyle = config.fontColor;
            } else if (obj.type === 1) {
                obj.ctx.fillStyle = config.memberFontColor;
            } else if (obj.type === 5) {
                obj.ctx.fillStyle = config.moderatorFontColor;
            }
            obj.ctx.lineWidth = calcFontSize() * config.borderWidth;
            obj.ctx.strokeStyle = config.borderColor;
            drawCommentOffScreen(obj.canvas, obj.ctx, obj);
        };

        drawCommentOffScreen(obj.canvas, obj.ctx, obj);
        return obj
    };

    // each statement object
    const stateObj = (type, data) => {
        let obj = {type: type};
        let elem;
        switch (type) {
            case 0: // str
                obj.text = data;
                break;
            case 1: // img
                elem = $(data).get(0);
                obj.src = elem.src;
                obj.text = elem.alt;
                obj.isPureEmoji = obj.text.length === 1;
                break;
        }
        return obj
    };

    // comment parse
    const parseComment = (comment) => {
        let userIdIndexOfImageSrc = 6;
        // type:
        //     0: normal
        //     1: member
        //     2: super chat
        //     3: member subscribe
        //     4: youtube engage
        //     5: moderator

        let obj = {};
        let author = $(comment.querySelector('#author-name'));
        let card = $(comment.querySelector('#card'));
        let timestamp = $(comment.querySelector('#timestamp'));
        obj.parsed = [];
        obj.id = comment.id;

        if (card.hasClass('yt-live-chat-membership-item-renderer')) {
            obj.type = 3;
            obj.parsed = [stateObj(0, obj.author)];
            return obj;
        } else if (card.hasClass('yt-live-chat-viewer-engagement-message-renderer')) {
            obj.type = 4;
            return obj;
        } else if (author.hasClass('member')) {
            obj.type = 1;
        } else if (author.hasClass('moderator')) {
            obj.type = 5;
        } else if (card.hasClass('yt-live-chat-paid-message-renderer')) {
            obj.type = 2;
            obj.BackGroundColor = $(comment).css('--yt-live-chat-paid-message-primary-color');
            obj.strokeColor = $(comment).css('--yt-live-chat-paid-message-secondary-color')
        } else {
            obj.type = 0;
        }
        obj.author = author.text().trim();

        let userName = !getInputField() || !getInputField().querySelector('#author-name') || $(getInputField().querySelector('#author-name')).text().trim();
        userName = userName === true ? '' : userName;

        if (author.text().trim() == userName ||
            author.text().trim() == `"${userName}"`) {
            obj.from = 'self';
        } else {
            obj.from = $(comment.querySelector('#img')).attr('src').split('/')[userIdIndexOfImageSrc];
        }

        if (obj.type === 0 || obj.type === 1 || obj.type === 5) {
            timestamp = timestamp.text().split(':');
            obj.postTime = (timestamp.length === 2) ? timestamp[0] * 60 + timestamp[1] * 1 : timestamp[0] * 3600 + timestamp[1] * 60 + timestamp[2] * 1;
            comment = comment.querySelector(messageFieldSelector).innerHTML;
        } else if (obj.type === 2) {
            timestamp = timestamp.text().split(':');
            obj.postTime = (timestamp.length === 2) ? timestamp[0] * 60 + timestamp[1] * 1 : timestamp[0] * 3600 + timestamp[1] * 60 + timestamp[2] * 1;
            obj.purchaseAmount = $(comment.querySelector('#purchase-amount')).text();
            config.showSuperChatAmount && obj.parsed.push(stateObj(0, ' ' + obj.purchaseAmount + ' '));
            comment = comment.querySelector(messageFieldSelector).innerHTML;
        }

        let imagetagSeparator = /(<img.+?>)/g;
        let separated = comment.split(imagetagSeparator);
        separated = separated.filter(n => n);
        separated.forEach((sep) => {
            // type:
            //     0: str
            //     1: image
            if (sep.startsWith('<img')) {
                obj.parsed.push(stateObj(1, sep))
            } else {
                obj.parsed.push(stateObj(0, htmlDecode((sep))))
            }
        });
        obj.hash = commentToText(obj).hashCode();
        return obj
    };

    const calcCommentSize = (comment) => {
        let width = 0.0;
        let height = 0.0;
        let fullwidth = commentContext.measureText('あ').width;
        let currentWidth;
        let metrics;
        let texts = [];
        comment.parsed.forEach((state) => {
            switch (state.type) {
                case 0: // str
                    metrics = commentContext.measureText(state.text);
                    currentWidth = metrics.width;
                    texts.push(state.text);
                    width += currentWidth;
                    state.width = currentWidth;
                    break;
                case 1: // emoji
                    width += fullwidth * 1.2;
                    height = Math.floor(fullwidth);
                    state.width = fullwidth * 1.2;
                    break
            }
        });
        metrics = commentContext.measureText(texts.join(''));
        comment.height = Math.max(metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent, height);
        return {width: width, height: comment.height}
    };


    // comment expire
    const setExpireInterval = () => {
        expireInterval = setInterval(() => {
            AllCommentLanes.forEach((commentLane) => {
                commentLane.forEach((comment) => {
                    if (comment.expired < currentTick() || comment.timestamp > currentTick()) {
                        commentLane.shift();
                    }
                });
            });
        }, 100);
    };

    // stop-play observe
    const setVideoOn = () => {
        const checkVideoIsPaused = () => {
            return !video.paused
        };
        video.onpause = () => {
            currentPlayState = 0;
        };
        video.onplay = () => {
            currentPlayState = 1;
        };

        // seek handler
        video.onseeking = () => {
            currentPlayState = 0;
        };
        video.onseeked = () => {
            currentPlayState = checkVideoIsPaused();
        }
    };

    // draw comment
    const drawComment = (comment, x, y) => {
        try {
            commentContext.drawImage(comment.canvas, x, y + calcFontSize() * (config.commentMargin + 1) * comment.laneOffset);
        } catch (e) {
        }
    };

    let newComers = [];
    let hands = ['👋', '👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿'];
    const welcomeNewMember = (comment) => {
        let canvas = createCanvas(calcFontSize() * 3, calcFontSize() * 3, comment);
        let rotationCanvas = createCanvas(calcFontSize() * 3, calcFontSize() * 3, comment);
        let timestamp = performance.now();
        let hand = hands[Math.floor(timestamp % hands.length)];

        canvas.context.textBaseline = 'bottom';
        rotationCanvas.context.textAlign = 'bottom';
        canvas.context.textBaseline = 'right';
        rotationCanvas.context.textAlign = 'right';

        canvas.context.fillText(hand, calcFontSize(), calcFontSize() * 2);
        newComers.push({
            timestamp: timestamp, name: comment.author,
            number: newComers.length, canvas: canvas.canvas, context: canvas.context,
            rotationCanvas: rotationCanvas.canvas, rotationContext: rotationCanvas.context
        });
    };

    let showDuration = 0.7;
    let animationDuration = 1.0;
    let disappearDuration = 0.7;

    let showDurationMilli = showDuration * 1000.0;
    let animationDurationMilli = animationDuration * 1000.0;
    let disappearDurationMilli = disappearDuration * 1000.0;

    let startToShown = showDurationMilli;
    let startToAnimated = startToShown + animationDurationMilli;
    let startToEnd = startToAnimated + disappearDurationMilli;

    const drawWelcome = () => {
        let currentTime = performance.now();
        let y = (AllCommentLanes.length - 1) * calcFontSize() * (config.commentMargin + 1);

        newComers.forEach((animation) => {
            if (animation.timestamp + startToShown > currentTime) { // showing up
                let xStart = -animation.canvas.width;
                let xTarget = animation.canvas.width * animation.number / 2;
                let x = (xTarget - xStart) / showDurationMilli * (currentTime - animation.timestamp);
                commentContext.drawImage(animation.canvas, x + xStart, y);
            } else if (animation.timestamp + startToAnimated > currentTime) {
                const rotateCanvas = (degree) => {
                    animation.rotationCanvas.width += 0;

                    animation.rotationContext.save();

                    animation.rotationContext.translate(Math.floor(calcFontSize()) * 3, Math.floor(calcFontSize() * 2));
                    animation.rotationContext.rotate(degree * Math.PI / 180);
                    animation.rotationContext.drawImage(animation.canvas, -calcFontSize() * 3, -calcFontSize() * 2);

                    animation.rotationContext.restore();

                    commentContext.drawImage(animation.rotationCanvas, xTarget, y);
                };
                let rotations = [0, -10, 12, -10, 9, 0, 0, 0, 0, 0];
                let currentLevel = (currentTime - animation.timestamp - startToShown) / animationDuration / 100;
                let rotationIndex = Math.floor(currentLevel);
                let rotationDegree = (rotations[rotationIndex + 1] - rotations[rotationIndex]) * (currentLevel % 1) + rotations[rotationIndex];
                let xTarget = animation.canvas.width * animation.number / 2;
                rotateCanvas(rotationDegree)
            } else if (animation.timestamp + startToEnd > currentTime) {
                let xTarget = -animation.canvas.width;
                let xStart = animation.canvas.width * animation.number / 2;
                let x = (xTarget - xStart) / disappearDurationMilli * (currentTime - animation.timestamp - startToAnimated);
                commentContext.drawImage(animation.canvas, x + xStart, y);
            } else {
                newComers.shift();
            }
        })
    };

    // update
    const update = () => {
        if ((!currentPlayState || !nicoTubeOn) && !needToRedraw) {
            requestAnimationFrame(update);
            return;
        }
        if (commentContext) {
            needToRedraw = false;
            commentContext.clearRect(0, 0, commentCanvas.width, commentCanvas.height);
            drawWelcome();
            for (const [index, commentLane] of AllCommentLanes.entries()) {
                commentLane.forEach((comment) => {
                    let commentWidth = comment.width;
                    let x = commentCanvas.width - (commentCanvas.width + commentWidth) * ((currentTick() - comment.timestamp) / (config.commentSpeed));
                    let y = index * calcFontSize() * (config.commentMargin + 1);
                    drawComment(comment, x, y);
                })
            }
            requestAnimationFrame(update);
        }
    };
}());