# Read App - Feature Ideas & Requirements

> If i knew what would, i would build it.
> The only thing that works is - not having my phone and reading a paperback book

## Focus & Distraction-Free Features

- [ ] **Custom iOS Focus Mode Integration**
  - Create a custom focus mode on iOS called "reading"
  - Switches ambient light (yellow tinted screen)
  - Suppress all notifications during reading sessions

- [ ] **Distraction-Free Reading Mode**
  - Reading experience where everything on the phone goes grey except the reading app
  - System-level visual dimming for non-reading apps
  - Immersive reading environment

- [ ] **Reading Lock**
  - Lock phone for a set duration (e.g., 20 minutes) for focused reading
  - Prevent exiting the reading app during the locked period
  - Only way to exit is restarting the phone (similar to macOS demo mentioned)
  - Optional timer display showing remaining lock time

## Content Aggregation & Management

- [ ] **Telegram Channel Integration**
  - Aggregate reading links from TG channels:
    - "ash reads"
    - "wu blockchain news"
  - Automatic content fetching and parsing
  - Daily content sync

- [ ] **Offline Daily Reading**
  - Download aggregated content on device for daily reading
  - Background sync when connected to Wi-Fi
  - Queue content for offline consumption

- [ ] **Automatic Storage Management**
  - Automatically clear storage for past week's reads
  - Configurable retention period (e.g., 7 days, 14 days)
  - Smart cleanup based on reading completion status
  - Keep important/bookmarked content regardless of age

## Core Reading Experience

- [ ] **Paper-like Reading Experience**
  - Emulate paperback book reading feel
  - Minimal distractions in the reading interface
  - Focus on typography and readability

## Technical Considerations

- [ ] **iOS System Integration**
  - Research iOS Screen Time API restrictions
  - Investigate Focus Mode API for custom modes
  - Explore notification suppression capabilities
  - Check feasibility of system-level UI modifications

- [ ] **Background Sync**
  - Implement reliable background content fetching
  - Handle network conditions gracefully
  - Battery-efficient sync scheduling

- [ ] **Storage Optimization**
  - Efficient content caching strategy
  - Smart cleanup algorithms
  - User preferences for storage management