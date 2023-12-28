class Player {
  constructor({ x, y, imageURL, color, username, radius }) {
    this.x = x
    this.y = y
    this.imageURL = imageURL
    this.color = color
    this.username = username
    this.radius = radius
    this.image = new Image(radius*2, radius*2)
    this.image.src = urlPrefix + this.imageURL
  }


  draw() {

    c.font = '16px sans-serif'
    c.fillStyle = 'white'
    c.fillText(this.username, this.x - this.radius, this.y + this.radius + 20)
    c.save()
    c.shadowColor = this.color
    c.shadowBlur = 20
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    // c.closePath()
    c.fillStyle = this.color
    c.fill()
    c.clip()
    c.drawImage(this.image, this.x-this.radius, this.y-this.radius, this.radius*2, this.radius*2);
    c.restore()
  }
}
