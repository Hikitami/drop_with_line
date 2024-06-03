
function defaultPreset() {
    const cookieInfo = JSON.stringify({
        'a1': {
            img: '/image/1.svg',
            title: 'Первый документ',
            subField: [{ title: "добавленное поле", value: "1" }]
        },
        'a2': {
            img: '/image/2.svg',
            title: 'Второй документ',
        },
        'a3': {
            img: '/image/3.svg',
            title: 'Третий документ',
        },
        'a4': {
            img: '/image/4.svg',
            title: 'Четвертый документ',
        },
    });

    if (!localStorage.getItem('default')) localStorage.setItem('default', cookieInfo);
}

class Canvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.lines = [];
        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());
        this.observeElementMovement();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;

        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.drawAllLines();
    }

    observeElementMovement() {
        const observer = new MutationObserver(() => this.drawAllLines());

        const config = { attributes: true, childList: true, subtree: true };

        document.querySelectorAll('*').forEach(element => observer.observe(element, config));
    }

    getElementBoundaryPoints(elementId) {
        const element = document.getElementById(elementId);
        const rect = element.getBoundingClientRect();
        const containerRect = this.canvas.parentElement.getBoundingClientRect();

        const points = [];

        for (let x = rect.left; x <= rect.right; x++) {
            points.push({ x: x - containerRect.left, y: rect.top - containerRect.top });
            points.push({ x: x - containerRect.left, y: rect.bottom - containerRect.top });
        }

        for (let y = rect.top; y <= rect.bottom; y++) {
            points.push({ x: rect.left - containerRect.left, y: y - containerRect.top });
            points.push({ x: rect.right - containerRect.left, y: y - containerRect.top });
        }

        return points;
    }

    getNearestPoints(elementId1, elementId2) {
        const points1 = this.getElementBoundaryPoints(elementId1);
        const points2 = this.getElementBoundaryPoints(elementId2);

        let nearestPoints = { point1: points1[0], point2: points2[0] };
        let minDistance = this.calculateDistance(nearestPoints.point1, nearestPoints.point2);

        points1.forEach(point1 => {
            points2.forEach(point2 => {
                const distance = this.calculateDistance(point1, point2);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPoints = { point1, point2 };
                }
            });
        });

        return nearestPoints;
    }

    calculateDistance(point1, point2) {
        return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
    }

    generateRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    addLine(elementId1, elementId2) {
        if (this.lines.some(line => line.elementIds[0] === elementId1 && line.elementIds[1] === elementId2)) {
            return;
        } else {
            const color = this.generateRandomColor();
            this.lines.push({ elementIds: [elementId1, elementId2], color });
            this.drawAllLines();
        }
    }

    removeLine(elementId) {
        const exclude = {};
        const lines = [];

        this.lines.forEach(line => {
            const lineIndex = line.elementIds.indexOf(elementId);
            if (lineIndex === -1) {
                lines.push(line);
            } else if (lineIndex > 0) {
                exclude[line.elementIds[1]] ? exclude[line.elementIds[1]].push(line.elementIds[0]) : exclude[line.elementIds[1]] = [line.elementIds[0]];
            }
        });

        this.lines = lines;

        this.drawAllLines();

        return exclude;
    }

    drawAllLines() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.lines.forEach(line => {
            this.drawLineBetweenElements(line.elementIds[0], line.elementIds[1], line.color);
        });
    }

    drawLineBetweenElements(elementId1, elementId2, color) {
        const nearestPoints = this.getNearestPoints(elementId1, elementId2);
        const point1 = nearestPoints.point1;
        const point2 = nearestPoints.point2;

        this.context.beginPath();
        this.context.moveTo(point1.x, point1.y);
        this.context.lineTo(point2.x, point2.y);
        this.context.strokeStyle = color;
        this.context.lineWidth = 2;
        this.context.stroke();

        this.drawArrowhead(point1, point2, color);
    }

    drawArrowhead(start, end, color) {
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = 10;
        const headAngle = Math.PI / 6;

        const arrowX1 = end.x - headLength * Math.cos(angle - headAngle);
        const arrowY1 = end.y - headLength * Math.sin(angle - headAngle);
        const arrowX2 = end.x - headLength * Math.cos(angle + headAngle);
        const arrowY2 = end.y - headLength * Math.sin(angle + headAngle);

        this.context.beginPath();
        this.context.moveTo(end.x, end.y);
        this.context.lineTo(arrowX1, arrowY1);
        this.context.moveTo(end.x, end.y);
        this.context.lineTo(arrowX2, arrowY2);
        this.context.strokeStyle = color;
        this.context.stroke();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    defaultPreset();

    const barInfo = JSON.parse(localStorage.getItem('default'));
    const barContent = document.querySelector('.bar__list');
    const content = document.querySelector('.content__block');
    const canvas = new Canvas('content_canvas');

    let card;
    let renderedLines = {};
    let connectInfo = {};

    // создание объектов
    for (let key in barInfo) {
        createObject(key, barInfo[key]);
    }

    async function createObject(id, item) {
        const barItem = document.createElement('div'),
            img = document.createElement('img'),
            title = document.createElement('div'),
            imgWrap = document.createElement('div'),
            subFields = document.createElement('div'),
            connectBtn = document.createElement('button'),
            subContentBtn = document.createElement('button');

        barItem.classList.add('bar__item');
        barItem.draggable = true;
        barItem.id = id;


        img.classList.add('bar__img');
        img.alt = item.title;
        img.src = item.img;

        imgWrap.classList.add('bar__img-wrap');
        imgWrap.append(img);

        title.classList.add('bar__title');
        title.textContent = item.title;

        subFields.classList.add('bar__sub-fields');
        connectBtn.classList.add('bar__connect-btn');

        connectBtn.addEventListener('click', () => connectEl(id, connectBtn))

        subContentBtn.classList.add('bar__sub-content-btn');
        subContentBtn.textContent = 'Добавить';
        subContentBtn.addEventListener('click', (e) => subContent(e, id, subFields))

        if (item.subField && item.subField.length > 0) {
            item.subField.forEach((el) => {
                const barSubWrapper = document.createElement('div');
                const barSubTitle = document.createElement('div');
                const barSubValue = document.createElement('div');

                barSubWrapper.classList.add('bar__sub-wrapper');
                barSubTitle.classList.add('bar__sub-title');
                barSubValue.classList.add('bar__sub-value');
                barSubTitle.textContent = el.title;
                barSubValue.textContent = el.value;

                barSubWrapper.append(barSubTitle, barSubValue);

                subFields.append(barSubWrapper);
            })
        }

        barItem.append(imgWrap, title, subFields, connectBtn, subContentBtn);

        barItem.addEventListener('dragstart', dragstart)

        barItem.addEventListener('dragend', dragend)

        if (item.drop == true) {
            if (item.bottom == false) {
                barItem.style.top = item.top;
            } else {
                barItem.style.bottom = '0px';
            }

            barItem.style.left = item.left;

            await content.append(barItem);

            if (item.connect?.length > 0) {
                startConnect(id)
            }

            return
        }

        barContent.append(barItem);
    }

    function createSubInfo(id, item) {
        const el = document.getElementById(id);
        const subContent = el.querySelector('.bar__sub-fields');

        if (item.subField && item.subField.length > 0) {
            subContent.replaceChildren();

            item.subField.forEach((el) => {
                const barSubWrapper = document.createElement('div');
                const barSubTitle = document.createElement('div');
                const barSubValue = document.createElement('div');

                barSubWrapper.classList.add('bar__sub-wrapper');
                barSubTitle.classList.add('bar__sub-title');
                barSubValue.classList.add('bar__sub-value');
                barSubTitle.textContent = el.title;
                barSubValue.textContent = el.value;

                barSubWrapper.append(barSubTitle, barSubValue);

                subContent.append(barSubWrapper);
            })
        }
    }

    function subContent(e, id, subFields) {
        e.preventDefault

        const popup = document.querySelector('.detail-popup');
        const content = popup.querySelector('.detail-popup__content');
        const form = popup.querySelector('.detail-popup__form');

        content.replaceChildren();

        form.reset()

        showCurrentFields(id, popup);
        const addButton = popup.querySelector('.detail-popup__add-field-btn');
        popup.data_id = id
        addButton.addEventListener('click', () => createAdditionalFields(popup));

        document.body.classList.add('detail-popup-open');
    }

    function showCurrentFields(id, popup) {
        const content = popup.querySelector('.detail-popup__content');
        const barItem = barInfo[id].subField;

        if (barItem && barItem.length > 0) {
            barItem.forEach((el) => {
                const detailInputWrapper = document.createElement('div');
                const detailInputTitle = document.createElement('div');
                const detailInput = document.createElement('input');

                detailInputWrapper.classList.add('detail-popup__input-wrapper');

                detailInputTitle.classList.add('detail-popup__input-title');
                detailInputTitle.textContent = el.title;

                detailInput.name = el.title;
                detailInput.value = el.value;
                detailInputWrapper.append(detailInputTitle, detailInput);

                content.append(detailInputWrapper);
            })
        }
    }

    function createAdditionalFields(popup) {
        const input = popup.querySelector('.detail-popup__add-field');
        const inputTitle = input.value;

        if (!inputTitle) {
            return
        }

        const content = popup.querySelector('.detail-popup__content');

        const detailInputWrapper = document.createElement('div');
        const detailInputTitle = document.createElement('div');
        const detailInput = document.createElement('input');

        detailInputWrapper.classList.add('detail-popup__input-wrapper');

        detailInputTitle.classList.add('detail-popup__input-title');
        detailInputTitle.textContent = inputTitle;

        detailInput.name = inputTitle;
        detailInputWrapper.append(detailInputTitle, detailInput);
        input.value = '';

        content.append(detailInputWrapper);
    }

    function connectEl(id, item) {
        if (!connectInfo.connect) {
            connectInfo.connect = true;
            connectInfo.from = id;

            item.classList.add('active');
        } else if (connectInfo.connect && connectInfo.from != id) {
            if (barInfo[connectInfo.from].connect?.length > 0) {
                !barInfo[connectInfo.from].connect.includes(id) && barInfo[connectInfo.from].connect.push(id);
            } else {
                barInfo[connectInfo.from].connect = [id];
            }

            canvas.addLine(connectInfo.from, id);

            let connectBtnFrom = document.getElementById(connectInfo.from).querySelector('.bar__connect-btn');

            connectBtnFrom.classList.remove('active');

            connectInfo.connect = false;
            delete connectInfo.from;

            localStorage.setItem('default', JSON.stringify(barInfo))
        } else {
            let connectBtnFrom = document.getElementById(connectInfo.from).querySelector('.bar__connect-btn');

            connectBtnFrom.classList.remove('active');
            connectInfo.connect = false;
            delete connectInfo.from
        }
    }


    content.addEventListener('dragover', (e) => {
        e.preventDefault();
    })

    content.addEventListener('drop', (e) => {
        if (e.target.classList.contains('content__block') || e.target.closest('.content__block')) {
            drop(e);
        }
    });


    barContent.addEventListener('dragover', (e) => {
        e.preventDefault();
    })

    barContent.addEventListener('drop', (e) => {
        if (e.target.classList.contains('bar__list') || e.target.closest('.bar__list')) {
            dropInBar(e);
        }
    })

    async function drop(e) {
        if (card.hasAttribute('style')) card.removeAttribute('style');

        let left = e.offsetX - (card.offsetWidth / 2);
        let top = e.offsetY - (card.offsetHeight / 2);

        let bottom = false

        if (left > content.offsetWidth - card.offsetWidth) {
            left = content.offsetWidth - card.offsetWidth;
        } else if (left < 0) {
            left = 0;
        }

        if (top > content.offsetHeight - card.offsetHeight) {
            bottom = true
        } else if (top < 0) {
            top = 0;
        }

        let percentageLeft = (left / content.offsetWidth) * 100;

        card.style.left = percentageLeft + '%';

        if (bottom) {
            card.style.bottom = '0';
        } else {
            let percentageTop = (top / content.offsetHeight) * 100;

            card.style.top = percentageTop + '%';
        }

        barInfo[card.id].left = card.style.left;
        barInfo[card.id].top = card.style.top;
        barInfo[card.id].bottom = bottom;
        barInfo[card.id].drop = true;

        await content.append(card);

        if (barInfo[card.id]?.connect?.length > 0) {
            startConnect(card.id)
        }

        localStorage.setItem('default', JSON.stringify(barInfo))
    }

    function startConnect(id) {
        const connect = barInfo[id].connect;

        connect.forEach((el) => {
            let connectedBlock = document.getElementById(id);

            if (connectedBlock) {
                canvas.addLine(id, el);

                checkConnect(id);
            } else {
                if (renderedLines[el] && !renderedLines[id].includes(id)) {
                    renderedLines[el].push(id)
                } else {
                    renderedLines[el] = [id];
                }
            }

            //
        })
    }

    //проверка коннекта линией
    function checkConnect(cardId) {
        if (renderedLines[cardId]) {
            renderedLines[cardId].forEach((id) => {
                canvas.addLine(id, cardId);
            })

            delete renderedLines[cardId];
        }
    }

    //перетаскивание в бар

    function dropInBar(e) {
        if (card.hasAttribute('style')) card.removeAttribute('style');
        const id = e.target.id


        barContent.append(card);

        const connect = canvas.removeLine(card.id);

        if (connect) {
            for (const key in connect) {
                renderedLines[key] ? connect[key].forEach(item => {
                    renderedLines[key].indexOf(item) === -1 && renderedLines[key].push(item)
                }) : renderedLines[key] = connect[key];
            }
        }
    }


    function dragstart(e) {
        card = e.target.classList.contains('bar__item') ? e.target : e.target.closest('.bar__item');

        setTimeout(function () {
            e.target.classList.add('hide');
        }, 0);
    }

    function dragend(e) {
        e.target.classList.remove('hide');
    }

    //форма
    const form = document.querySelector('.popup__form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = 'A' + Math.random().toString(36).substr(2, 32);
        const formData = new FormData(form);

        const object = {};

        formData.forEach((value, key) => {
            object[key] = value;
        });

        barInfo[id] = object;

        createObject(id, object);

        localStorage.setItem('default', JSON.stringify(barInfo))
        document.body.classList.remove('popup-open');
    })


    const formDetail = document.querySelector('.detail-popup__form');

    formDetail.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.querySelector('.detail-popup').data_id

        const formData = new FormData(formDetail);

        const { subField } = barInfo[id];

        formData.forEach((value, key) => {
            const checkField = subField?.find((el) => el.title == key);
            if (!checkField && key != 'add-field' && value != '') {
                const field = {
                    title: key,
                    value: value
                }

                barInfo[id].subField ? barInfo[id].subField.push(field) : barInfo[id].subField = [field]
            }
        });


        createSubInfo(id, barInfo[id]);

        localStorage.setItem('default', JSON.stringify(barInfo))

        document.body.classList.remove('detail-popup-open');
    })
    //попап
    const showPopup = document.querySelector('.bar__add');

    showPopup.addEventListener('click', () => {
        document.body.classList.add('popup-open');
    })

    const popup = document.querySelector('.popup');

    popup.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup')) {
            document.body.classList.remove('popup-open');
        }
    })

    const detailPopup = document.querySelector('.detail-popup');

    detailPopup.addEventListener('click', (e) => {
        if (e.target.classList.contains('detail-popup')) {
            document.body.classList.remove('detail-popup-open');
        }
    })
})
