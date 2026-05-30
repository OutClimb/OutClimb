//
// Event Store
// Copyright 2026 OutClimb
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

package store

import (
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"time"
)

var eventsHTTPClient = &http.Client{Timeout: 10 * time.Second}

type Event struct {
	Title          string
	Link           string
	Description    string
	ContentEncoded string
	MediaURL       string
	MediaType      string
	PubDate        string
	EventDate      time.Time
	GUID           string
}

type EventFeed struct {
	Title       string
	Link        string
	Description string
	Events      []*Event
}

type rssRoot struct {
	XMLName xml.Name   `xml:"rss"`
	Channel rssChannel `xml:"channel"`
}

type rssChannel struct {
	Title       string    `xml:"title"`
	Link        string    `xml:"link"`
	Description string    `xml:"description"`
	Items       []rssItem `xml:"item"`
}

type rssMediaContent struct {
	URL  string `xml:"url,attr"`
	Type string `xml:"type,attr"`
}

type rssItem struct {
	Title          string          `xml:"title"`
	Link           string          `xml:"link"`
	Description    string          `xml:"description"`
	PubDate        string          `xml:"pubDate"`
	GUID           string          `xml:"guid"`
	ContentEncoded string          `xml:"http://purl.org/rss/1.0/modules/content/ encoded"`
	MediaContent   rssMediaContent `xml:"http://www.rssboard.org/media-rss content"`
}

// parseEventDateFromURL extracts the event date from the trailing YYYY-MM-DD in the event URL.
func parseEventDateFromURL(link string) (time.Time, error) {
	if len(link) < 10 {
		return time.Time{}, fmt.Errorf("link too short to contain a date: %s", link)
	}
	return time.Parse("2006-01-02", link[len(link)-10:])
}

func (s *storeLayer) GetAllEvents() (*EventFeed, error) {
	resp, err := eventsHTTPClient.Get(s.storeConfig.EventsRSSURL)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var raw rssRoot
	if err := xml.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	feed := &EventFeed{
		Title:       raw.Channel.Title,
		Link:        raw.Channel.Link,
		Description: raw.Channel.Description,
	}

	for _, item := range raw.Channel.Items {
		eventDate, err := parseEventDateFromURL(item.Link)
		if err != nil {
			continue
		}
		feed.Events = append(feed.Events, &Event{
			Title:          item.Title,
			Link:           item.Link,
			Description:    item.Description,
			ContentEncoded: item.ContentEncoded,
			MediaURL:       item.MediaContent.URL,
			MediaType:      item.MediaContent.Type,
			PubDate:        item.PubDate,
			EventDate:      eventDate,
			GUID:           item.GUID,
		})
	}

	return feed, nil
}
