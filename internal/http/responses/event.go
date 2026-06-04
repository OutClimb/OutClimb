//
// Event Response
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

package responses

import (
	"encoding/xml"

	"github.com/OutClimb/OutClimb/internal/app/models"
)

type EventFeedPublic struct {
	XMLName xml.Name           `xml:"rss"`
	Version string             `xml:"version,attr"`
	Channel eventChannelPublic `xml:"channel"`
}

type eventChannelPublic struct {
	Title       string        `xml:"title"`
	Link        string        `xml:"link"`
	Description string        `xml:"description"`
	Items       []EventPublic `xml:"item"`
}

// cdataContent wraps a string so it marshals as a CDATA section.
type cdataContent struct {
	Inner []byte `xml:",innerxml"`
}

type mediaContentPublic struct {
	URL  string `xml:"url,attr"`
	Type string `xml:"type,attr,omitempty"`
}

type EventPublic struct {
	Title          string              `xml:"title"`
	Link           string              `xml:"link"`
	Description    string              `xml:"description"`
	PubDate        string              `xml:"pubDate"`
	GUID           string              `xml:"guid"`
	ContentEncoded *cdataContent       `xml:"http://purl.org/rss/1.0/modules/content/ encoded"`
	MediaContent   *mediaContentPublic `xml:"http://www.rssboard.org/media-rss content"`
}

func (f *EventFeedPublic) Publicize(feed *models.EventFeedInternal) {
	f.Version = "2.0"
	f.Channel.Title = feed.Title
	f.Channel.Link = feed.Link
	f.Channel.Description = feed.Description
	f.Channel.Items = make([]EventPublic, 0, len(feed.Events))
	for _, event := range feed.Events {
		ep := EventPublic{
			Title:       event.Title,
			Link:        event.Link,
			Description: event.Description,
			PubDate:     event.PubDate,
			GUID:        event.GUID,
		}
		if event.ContentEncoded != "" {
			ep.ContentEncoded = &cdataContent{Inner: []byte("<![CDATA[" + event.ContentEncoded + "]]>")}
		}
		if event.MediaURL != "" {
			ep.MediaContent = &mediaContentPublic{URL: event.MediaURL, Type: event.MediaType}
		}
		f.Channel.Items = append(f.Channel.Items, ep)
	}
}
