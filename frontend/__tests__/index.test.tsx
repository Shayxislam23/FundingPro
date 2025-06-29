import { render, screen } from '@testing-library/react'
import Home from '../pages/index'

test('renders landing', () => {
  render(<Home />)
  expect(screen.getByText('FundingPro')).toBeInTheDocument()
})
