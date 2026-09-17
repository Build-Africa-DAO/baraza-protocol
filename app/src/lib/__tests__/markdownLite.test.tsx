import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderMarkdownLite } from '@/lib/markdownLite';

describe('renderMarkdownLite', () => {
  it('renders paragraphs, lists and emphasis as elements, never as HTML', () => {
    render(<div>{renderMarkdownLite('First **bold** line.\n\n- one\n- *two*\n\n1. a\n2. b\n\n<img src=x onerror=alert(1)>')}</div>);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('two').tagName).toBe('EM');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  });
});
