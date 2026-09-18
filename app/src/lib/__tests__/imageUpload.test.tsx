import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setStoredCommunityImage, setStoredUserAvatar, useCommunityImage, useUserAvatar } from '@/lib/imageUpload';

function GroupLogo({ id }: { id: string }) {
  const { image } = useCommunityImage(id, undefined);
  return <span data-testid="logo">{image ?? 'none'}</span>;
}

function Avatar() {
  const { avatarUrl } = useUserAvatar();
  return <span data-testid="avatar">{avatarUrl ?? 'none'}</span>;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('image stores propagate to every subscriber', () => {
  it('updates a group logo everywhere it is shown when one place changes it', () => {
    render(
      <>
        <GroupLogo id="1" />
        <GroupLogo id="1" />
        <GroupLogo id="2" />
      </>,
    );
    act(() => setStoredCommunityImage('1', 'data:image/png;base64,AAA'));
    const logos = screen.getAllByTestId('logo').map((el) => el.textContent);
    expect(logos).toEqual(['data:image/png;base64,AAA', 'data:image/png;base64,AAA', 'none']);
    act(() => setStoredCommunityImage('1', null));
    expect(screen.getAllByTestId('logo').map((el) => el.textContent)).toEqual(['none', 'none', 'none']);
  });

  it('updates the profile photo in every subscriber', () => {
    render(
      <>
        <Avatar />
        <Avatar />
      </>,
    );
    act(() => setStoredUserAvatar('data:image/png;base64,BBB'));
    expect(screen.getAllByTestId('avatar').map((el) => el.textContent)).toEqual(['data:image/png;base64,BBB', 'data:image/png;base64,BBB']);
  });
});
