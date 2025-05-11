describe('Riyadh Metro Home Page', () => {
  it('successfully loads', () => {
    cy.visit('/')
    cy.contains('Riyadh Metro') // replace with actual text on your homepage
  })
})
