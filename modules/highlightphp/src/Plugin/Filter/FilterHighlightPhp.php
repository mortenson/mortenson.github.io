<?php

namespace Drupal\highlightphp\Plugin\Filter;

use Drupal\filter\FilterProcessResult;
use Drupal\filter\Plugin\FilterBase;

/**
 * Highlights <code> tags in HTML.
 *
 * @Filter(
 *   id = "filter_highlightphp",
 *   title = @Translation("Highlight &lt;code&gt; tags in HTML."),
 *   type = Drupal\filter\Plugin\FilterInterface::TYPE_TRANSFORM_IRREVERSIBLE,
 *   weight = 10
 * )
 */
class FilterHighlightPhp extends FilterBase {

  /**
   * {@inheritdoc}
   */
  public function process($text, $langcode) {
    if ($highlighted = highlightphp_highlight($text)) {
      $result = new FilterProcessResult($highlighted);
      $result->addAttachments(['library' => ['highlightphp/main']]);
    }
    else {
      $result = new FilterProcessResult($text);
    }

    return $result;
  }

}
