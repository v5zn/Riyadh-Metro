describe('Riyadh Metro Website', () => {
  it('loads the Ticket page', () => {
    cy.visit('http://localhost:8000/tickets.html')
    cy.contains('Tickets').should('exist')
  })

  it('navigates to Contact page', () => {
    cy.visit('http://localhost:8000/index.html')
    cy.get('a[href="contact.html"]').click()
    cy.url().should('include', '/contact.html')
  })
})
