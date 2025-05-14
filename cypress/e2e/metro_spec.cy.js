describe('Riyadh Metro Website', () => {
  it('successfully loads', () => {
    cy.visit('/')
    cy.contains('Riyadh Metro') // replace with actual text on your homepage
  })
  it('Submits the Contact form', () => {
  cy.visit('http://localhost:8080/Contact.html')
  cy.get('#email').type('test@example.com')
  cy.get('#message').type('This is a test message.')
  cy.get('form').submit()
})
  it('Navigates through the navbar links', () => {
  cy.visit('http://localhost:8080/index.html')
  cy.get('nav a[href="tickets.html"]').click()
  cy.url().should('include', '/tickets.html')
  cy.go('back')
  cy.get('nav a[href="About.html"]').click()
  cy.url().should('include', '/About.html')
})
  it('Checks arrival times are displayed on Line page', () => {
  cy.visit('http://localhost:8080/red.html')
  cy.get('#timer').should('exist') // update selector to match your markup
  cy.get('#timer').should('have.length.greaterThan', 1)
})
  it('Displays different ticket types and prices', () => {
  cy.visit('http://localhost:8080/tickets.html')
  cy.get('.ticket p').should('have.length.at.least', 1)
  cy.get('.ticket p').each(($el) => {
    expect($el.text()).to.match(/^\d+(\.\d{2})? SAR$/)
  })
})

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
    cy.get('nav a[href="Contact.html"]').click()
    cy.url().should('include', '/Contact.html')
  })

  // Test 4: Check that Plan Path button exists
  it('Check that the Plan Path button exists on Home page', () => {
    cy.visit('http://localhost:8080/index.html')
    cy.get('.buttons2').should('exist') // Update this selector to match your actual button id or class
  })

  // Test 5: Verify number of Metro Lines displayed
  it('Checks the number of Metro lines displayed', () => {
    cy.visit('http://localhost:8080/line.html')
    cy.get('.fas fa-train').should('have.length', 6) // Assuming each line uses a 'metro-line' class
  })
})
