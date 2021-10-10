const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]//儲存花色

const utility = {
  getRandomNumberArray(count) {//單獨放在一個物件，外掛涵式庫
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

const view = {
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
  ,
  appendWrongAnimation(card) {//動畫模式
    card.classList.add("wrong")//增加卡片class屬性
    card.addEventListener('animationend', () => card.classList.remove('wrong'), { once: true })
  }//監聽器=>監聽事件:動畫結束後，一旦動畫結束後便移除class屬性以及卸載監聽器  
  ,
  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`;
  }
  ,

  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`;
  }
  ,
  pairCard(card) {//將"match"的卡片改變花色
    card.classList.add('paired')
  }
  ,
  flipCard(card) {//翻牌涵式
    if (card.classList.contains('back')) {// 如果點擊的是背面
      card.classList.remove('back')//移除背面預設CSS樣式
      card.innerHTML = this.getCardContent(parseInt(card.dataset.index)) // 讀取<card>元素上的data代號 帶進函數
      return//跳出整個函式
    }
    card.classList.add('back')//恢復成蓋牌狀態
    card.innerHTML = null//把之前寫的花色跟數字塗掉
  }
  ,
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`
  }//剛開始每張卡片都是背面，將每張卡片綁索引編號
  ,
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `<p>${number}</p>
        <img src="${symbol}" />
        <p>${number}</p>`
  }
  ,
  transformNumber(number) {//特殊數字轉換
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  displayCards() {//負責選出 #cards 並抽換內容
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = utility.getRandomNumberArray(52).map(index => this.getCardElement(index)).join("")//將洗好排序的0~51數字陣列，依序丟進函式產生有52個template literal的字串陣列，運用join涵數合併渲染整個頁面
  }
}

const model = {//資料管理群組
  revealedCards: []
  ,
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
    //檢查data-index上的代號轉成number牌號後是否一樣
  }
  ,
  score: 0
  ,
  triedTimes: 0
}
const controller = {//流程控制器，分配工作
  currentState: GAME_STATE.FirstCardAwaits,

  generateCards() {
    view.displayCards()
  }
  ,
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {//如果卡片元素是"不是"蓋牌狀態，表示已經翻過，則跳出函式
      return
    }
    switch (this.currentState) {//當狀態是等第一張牌則
      case GAME_STATE.FirstCardAwaits:
        view.flipCard(card)//翻牌
        model.revealedCards.push(card)//啟用資料管理模組，將卡片資料暫存
        this.currentState = GAME_STATE.SecondCardAwaits//把狀態改成等第二張牌
        break//停止動作
      case GAME_STATE.SecondCardAwaits://當狀態是等第二張牌則
        view.renderTriedTimes(++model.triedTimes)//將嘗試次數+1
        view.flipCard(card)//翻牌
        model.revealedCards.push(card)
        // 判斷配對是否成功↓
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)//加十分
          this.currentState = GAME_STATE.CardsMatched//改狀態
          model.revealedCards.forEach(element => view.pairCard(element))////將"match"的卡片改變花色
          model.revealedCards = []//重新寫入值=[]空陣列，刪除暫存
          if (model.score === 260) {//如果滿分即遊戲結束
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits//將狀態改回等第一張卡片
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed//把狀態改成配對失敗
          model.revealedCards.forEach(element => view.appendWrongAnimation(element))//跑失敗的動畫
          setTimeout(() => {
            model.revealedCards.forEach(element => view.flipCard(element))//將卡片恢復成蓋牌狀態
            model.revealedCards = []//重新寫入值=[]空陣列，刪除暫存
            this.currentState = GAME_STATE.FirstCardAwaits
          }//將狀態改回等第一張卡片
            , 1000)//延遲以下動作一秒，否則使用者還沒看到第二個牌號就蓋牌，1000毫秒為1秒
        }
        break//停止動作

    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))//把陣列中的元素丟進涵式讀值
  }
}
controller.generateCards()





//使用forEach涵數為每張卡片都綁定監聽器
document.querySelectorAll('.card').forEach(card =>
  card.addEventListener('click', function (event) {
    controller.dispatchCardAction(card)
    //點擊後將dom選取的card元素，帶入參數重新啟用函式渲染頁面
  })
)


