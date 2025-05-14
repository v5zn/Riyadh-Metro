describe('Riyadh Metro Website', () => {

  // Test 1: Home page loads
  it('Loads the Home page', () => {
    cy.visit('http://localhost:8080/index.html')
    cy.title().should('include', 'Riyadh Metro')
  })

  // Test 2: Ticket page loads
  it('Loads the Ticket page', () => {
    cy.visit('http://localhost:8080/tickets.html')
    cy.contains('Tickets').should('exist')
  })

  // Test 3: Navigation to Contact page
  it('Navigates to the Contact page from Home', () => {
    cy.visit('http://localhost:8080/index.html')
    cy.get('a[href="contact.html"]').click()
    cy.url().should('include', '/contact.html')
  })

  // Test 4: Check that Plan Path button exists
  it('Check that the Plan Path button exists on Home page', () => {
    cy.visit('http://localhost:8080/index.html')
    cy.get('buttons2').should('exist') // Update this selector to match your actual button id or class
  })

  // Test 5: Verify number of Metro Lines displayed
  it('Checks the number of Metro lines displayed', () => {
    cy.visit('http://localhost:8080/line.html')
    cy.get('fas fa-train').should('have.length', 6) // Assuming each line uses a 'metro-line' class
  })
})
